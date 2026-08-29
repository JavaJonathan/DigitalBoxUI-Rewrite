import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { generateShippableItemsReport } from '../api/reports';
import { getApiErrorMessage } from '../api/client';
import { parseCsvHeaders, guessInventoryColumns, toCsv, downloadCsv } from '../lib/csv';
import { Mono } from './ui/Mono';
import { FileDropzone } from './ui/FileDropzone';
import type { ShippableItemsResponse } from '../types';

interface ShippableItemsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Phase = 'pick' | 'map' | 'done';

export function ShippableItemsDialog({ open, onClose }: ShippableItemsDialogProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ sku: '', title: '', qty: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShippableItemsResponse | null>(null);

  const reset = () => {
    setPhase('pick');
    setFile(null);
    setHeaders([]);
    setMapping({ sku: '', title: '', qty: '' });
    setError(null);
    setResult(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const accept = async (f: File | undefined) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Choose a .csv file.');
      return;
    }
    setError(null);
    setFile(f);
    const head = await f.slice(0, 64 * 1024).text();
    const cols = parseCsvHeaders(head);
    if (cols.length === 0) {
      setError('That file has no header row.');
      return;
    }
    setHeaders(cols);
    const guess = guessInventoryColumns(cols);
    setMapping({ sku: guess.sku, title: guess.title, qty: guess.qty });
    setPhase('map');
  };

  const generate = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await generateShippableItemsReport(file, {
        skuColumn: mapping.sku,
        titleColumn: mapping.title,
        qtyColumn: mapping.qty,
      });
      setResult(res);
      setPhase('done');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not generate the report.'));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `DigitalBoxShippableItems-${stamp}.csv`,
      toCsv(result.rows, [
        { key: 'title', header: 'title' },
        { key: 'sku', header: 'sku' },
        { key: 'orderedQty', header: 'ordered_qty' },
        { key: 'onHandQty', header: 'on_hand_qty' },
        { key: 'shippableQty', header: 'shippable_qty' },
      ]),
    );
  };

  const mapField = (label: string, value: string, onChange: (v: string) => void) => (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    >
      {headers.map((h) => (
        <MenuItem key={h} value={h}>
          {h}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <DialogTitle>Shippable items report</DialogTitle>
        <IconButton size="small" onClick={close} disabled={busy} aria-label="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent>
        {phase === 'pick' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Upload an inventory-count CSV. DigitalBox cross-references it against open orders and
              tells you what you can pack now.
            </Typography>
            <FileDropzone
              accept=".csv,text/csv"
              disabled={busy}
              onFiles={(list) => accept(list[0])}
            >
              <UploadFileOutlinedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 550, mt: 1 }}>
                Drop a .csv here, or click to choose
              </Typography>
            </FileDropzone>
          </>
        )}

        {phase === 'map' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Match the columns from <strong>{file?.name}</strong>.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mapField('SKU column', mapping.sku, (v) => setMapping((m) => ({ ...m, sku: v })))}
              {mapField('Product title column', mapping.title, (v) =>
                setMapping((m) => ({ ...m, title: v })),
              )}
              {mapField('On-hand quantity column', mapping.qty, (v) =>
                setMapping((m) => ({ ...m, qty: v })),
              )}
            </Box>
            {busy && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}

        {phase === 'done' && result && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              <strong>{result.matchedRowCount}</strong> of {result.csvRowCount} inventory rows match
              an open order ({result.openOrderCount} open orders).
            </Typography>
            <TableContainer
              sx={{
                border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                borderRadius: 2,
                maxHeight: 320,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">On hand</TableCell>
                    <TableCell align="right">Shippable</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rows.slice(0, 100).map((r, i) => (
                    <TableRow key={`${r.sku}-${i}`}>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography sx={{ fontSize: '0.8125rem' }} noWrap>
                          {r.title}
                        </Typography>
                        <Mono muted sx={{ fontSize: '0.6875rem' }}>
                          {r.sku}
                        </Mono>
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {r.orderedQty}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {r.onHandQty}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 650,
                          color: r.shippableQty > 0 ? 'success.main' : 'text.disabled',
                        }}
                      >
                        {r.shippableQty}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {result.rows.length > 100 && (
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mt: 1, display: 'block' }}
              >
                Showing the first 100 rows — the download has all {result.rows.length}.
              </Typography>
            )}
          </>
        )}

        {error && (
          <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: 'error.main' }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        {phase === 'done' ? (
          <>
            <Button variant="text" onClick={reset}>
              Start over
            </Button>
            <Button variant="contained" onClick={download}>
              Download CSV
            </Button>
          </>
        ) : (
          <>
            <Button variant="text" onClick={close} disabled={busy}>
              Cancel
            </Button>
            {phase === 'map' && (
              <Button
                variant="contained"
                onClick={generate}
                disabled={busy || !mapping.sku || !mapping.title || !mapping.qty}
              >
                Generate
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
