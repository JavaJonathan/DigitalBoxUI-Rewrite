import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { pluralize } from '../lib/format';

interface ConfirmActionDialogProps {
  open: boolean;
  intent: 'ship' | 'cancel';
  count: number;
  onClose: () => void;
  onConfirm: (actionedBy: string) => Promise<void> | void;
}

export function ConfirmActionDialog({ open, intent, count, onClose, onConfirm }: ConfirmActionDialogProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setBusy(false);
  }, [open]);

  const ship = intent === 'ship';

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm(name.trim());
      setName('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{ship ? 'Ship orders' : 'Cancel orders'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {ship
            ? `Mark ${pluralize(count, 'order')} as shipped and move them to history.`
            : `Cancel ${pluralize(count, 'order')} and move them to history.`}{' '}
          Enter your name for the record.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 60 } }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) handleConfirm();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={busy}>
          Back
        </Button>
        <Button
          variant="contained"
          color={ship ? 'success' : 'error'}
          disabled={busy || name.trim().length === 0}
          onClick={handleConfirm}
        >
          {busy ? 'Working…' : ship ? `Ship ${count}` : `Cancel ${count}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
