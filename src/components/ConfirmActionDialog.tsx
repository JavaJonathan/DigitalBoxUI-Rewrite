import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  count: number;
  confirmLabel: string;
  confirmColor?: 'primary' | 'error' | 'success';
  onClose: () => void;
  onConfirm: (actionedBy: string) => Promise<void> | void;
}

export function ConfirmActionDialog({
  open,
  title,
  count,
  confirmLabel,
  confirmColor = 'primary',
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {count} order{count === 1 ? '' : 's'} selected. Enter your name for the record.
        </DialogContentText>
        <TextField
          autoFocus
          label="Your name"
          fullWidth
          value={name}
          slotProps={{ htmlInput: { maxLength: 60 } }}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          disabled={busy || name.trim().length === 0}
          onClick={handleConfirm}
        >
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
