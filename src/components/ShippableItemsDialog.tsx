import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { generateShippableItemsReport } from '../api/reports';
import { getApiErrorMessage } from '../api/client';
import { parseCsvHeaders, guessInventoryColumns, toCsv, downloadCsv } from '../lib/csv';
import { Mono } from './ui/Mono';
import { FileDropzone } from './ui/FileDropzone';
import type { ShippableItemsResponse, ShippableCoverage } from '../types';
import { DialogHeader } from './ui/DialogHeader';

interface ShippableItemsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Phase = 'pick' | 'map' | 'done';
type ResultTab = 'items' | 'unmatched';

const COVERAGE_COLOR: Record<ShippableCoverage, 'success' | 'warning'> = {
  Covered: 'success',
  Partial: 'warning',
};

const stamp = () => new Date().toISOString().slice(0, 10);

export function ShippableItemsDialog({ open, onClose }: ShippableItemsDialogProps) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ sku: '', title: '', qty: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShippableItemsResponse | null>(null);
  const [tab, setTab] = useState<ResultTab>('items');

  const reset = () => {
    setPhase('pick');
    setFile(null);
    setHeaders([]);
    setMapping({ sku: '', title: '', qty: '' });
    setError(null);
    setResult(null);
    setTab('items');
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
      setTab('items');
      setPhase('done');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not generate the report.'));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    if (tab === 'items') {
      downloadCsv(
        `DigitalBoxShippableItems-by-item-${stamp()}.csv`,
        toCsv(result.rows, [
          { key: 'title', header: 'title' },
          { key: 'sku', header: 'sku' },
          { key: 'orderedQty', header: 'ordered_qty' },
          { key: 'onHandQty', header: 'on_hand_qty' },
          { key: 'shippableQty', header: 'shippable_qty' },
          { key: 'shortQty', header: 'short_qty' },
          { key: 'coverage', header: 'coverage' },
        ]),
      );
    } else {
      downloadCsv(
        `DigitalBoxShippableItems-not-in-inventory-${stamp()}.csv`,
        toCsv(
          result.unmatchedDemand.map((u) => ({
            title: u.title,
            sku: u.sku ?? '',
            ordered_qty: u.orderedQty,
            order_count: u.orderCount,
          })),
          [
            { key: 'title', header: 'title' },
            { key: 'sku', header: 'sku' },
            { key: 'ordered_qty', header: 'ordered_qty' },
            { key: 'order_count', header: 'order_count' },
          ],
        ),
      );
    }
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

  const downloadLabel = tab === 'items' ? 'Download item list' : 'Download list';
  const downloadDisabled =
    !result ||
    (tab === 'items' && result.rows.length === 0) ||
    (tab === 'unmatched' && result.unmatchedDemand.length === 0);

  return (
    <Dialog open={open} onClose={close} maxWidth={phase === 'done' ? 'md' : 'sm'} fullWidth>
      <DialogHeader title={'Shippable items report'} onClose={close} disabled={busy} />

      <DialogContent>
        {phase === 'pick' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              Upload an inventory-count CSV. DigitalBox tells you which items you have enough stock
              to ship in general, across all open orders, with no order-by-order breakdown.
            </Typography>
            <FileDropzone
              accept=".csv,text/csv"
              disabled={busy}
              onFiles={(list) => accept(list[0])}
            >
              <UploadFileOutlinedIcon fontSize="large" sx={{ color: 'text.secondary' }} />
              <Typography sx={{ fontWeight: 550, mt: 1 }}>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              <Chip
                size="small"
                color="success"
                label={`${result.unitsShippable} units shippable`}
              />
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                {result.matchedRowCount} of {result.csvRowCount} inventory rows matched ·{' '}
                {result.openOrderCount} open orders
              </Typography>
            </Box>

            <Tabs
              value={tab}
              onChange={(_, v: ResultTab) => setTab(v)}
              sx={{ mb: 1.5, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}
            >
              <Tab value="items" label={`Items (${result.rows.length})`} />
              <Tab
                value="unmatched"
                label={`Not in inventory (${result.unmatchedDemand.length})`}
              />
            </Tabs>

            {tab === 'items' && (
              <>
                <TableContainer
                  sx={{
                    maxHeight: 360,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Ordered</TableCell>
                        <TableCell align="right">On hand</TableCell>
                        <TableCell align="right">Shippable</TableCell>
                        <TableCell align="right">Short</TableCell>
                        <TableCell align="right">Coverage</TableCell>
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
                          <TableCell
                            align="right"
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              color: r.shortQty > 0 ? 'error.main' : 'text.disabled',
                            }}
                          >
                            {r.shortQty}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              color={COVERAGE_COLOR[r.coverage]}
                              label={r.coverage}
                            />
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
                    Showing the first 100 rows; the download has all {result.rows.length}.
                  </Typography>
                )}
              </>
            )}

            {tab === 'unmatched' && (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Open-order demand with no matching row in your upload: out of stock, a SKU
                  mismatch, or a variant SKU the report skips.
                </Typography>
                {result.unmatchedDemand.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Every open-order line matched an inventory row.
                  </Typography>
                ) : (
                  <TableContainer
                    sx={{
                      maxHeight: 320,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Ordered</TableCell>
                          <TableCell align="right">Orders</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.unmatchedDemand.slice(0, 200).map((u, i) => (
                          <TableRow key={`${u.sku ?? u.title}-${i}`}>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography sx={{ fontSize: '0.8125rem' }} noWrap>
                                {u.title || '—'}
                              </Typography>
                              {u.sku && (
                                <Mono muted sx={{ fontSize: '0.6875rem' }}>
                                  {u.sku}
                                </Mono>
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {u.orderedQty}
                            </TableCell>
                            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {u.orderCount}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
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
            <Button variant="contained" onClick={download} disabled={downloadDisabled}>
              {downloadLabel}
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
