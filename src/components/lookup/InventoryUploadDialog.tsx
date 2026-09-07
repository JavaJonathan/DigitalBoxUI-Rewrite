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
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { uploadInventory } from '../../api/lookup';
import { getApiErrorMessage } from '../../api/client';
import { parseCsvHeaders, guessInventoryColumns } from '../../lib/csv';
import { FileDropzone } from '../ui/FileDropzone';
import type { InventoryKind, InventoryStatus } from '../../types';

interface InventoryUploadDialogProps {
  kind: InventoryKind;
  onClose: () => void;
  onUploaded: (status: InventoryStatus) => void;
}

const KIND_COPY: Record<InventoryKind, { title: string; blurb: string }> = {
  inStock: {
    title: 'Replace in-stock list',
    blurb:
      'Upload a CSV of SKUs currently on hand. The lookup marks matching line items as “In stock”.',
  },
  purchaseOrders: {
    title: 'Replace purchase-order list',
    blurb:
      'Upload a CSV of SKUs on open purchase orders. The lookup marks matching line items as “Pre-ordered”. Only the SKU column is needed.',
  },
};

type Phase = 'pick' | 'map';

export function InventoryUploadDialog({ kind, onClose, onUploaded }: InventoryUploadDialogProps) {
  const needsAllColumns = kind === 'inStock';
  const [phase, setPhase] = useState<Phase>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ sku: '', title: '', qty: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (busy) return;
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

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const status = await uploadInventory(kind, file, {
        skuColumn: mapping.sku,
        titleColumn: needsAllColumns ? mapping.title : undefined,
        qtyColumn: needsAllColumns ? mapping.qty : undefined,
      });
      onUploaded(status);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not upload the list.'));
      setBusy(false);
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

  const canSubmit =
    !busy && Boolean(mapping.sku) && (!needsAllColumns || (Boolean(mapping.title) && Boolean(mapping.qty)));

  return (
    <Dialog open onClose={close} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <DialogTitle>{KIND_COPY[kind].title}</DialogTitle>
        <IconButton size="small" onClick={close} disabled={busy} aria-label="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent>
        {phase === 'pick' && (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {KIND_COPY[kind].blurb}
            </Typography>
            <FileDropzone accept=".csv,text/csv" disabled={busy} onFiles={(list) => accept(list[0])}>
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
              {needsAllColumns && (
                <>
                  {mapField('Product title column', mapping.title, (v) =>
                    setMapping((m) => ({ ...m, title: v })),
                  )}
                  {mapField('On-hand quantity column', mapping.qty, (v) =>
                    setMapping((m) => ({ ...m, qty: v })),
                  )}
                </>
              )}
            </Box>
            {busy && <LinearProgress sx={{ mt: 2 }} />}
          </>
        )}

        {error && (
          <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: 'error.main' }}>{error}</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={close} disabled={busy}>
          Cancel
        </Button>
        {phase === 'map' && (
          <Button variant="contained" onClick={submit} disabled={!canSubmit}>
            {busy ? 'Uploading…' : 'Replace list'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
