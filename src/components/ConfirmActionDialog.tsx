import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { pluralize } from '../lib/format';

type Intent = 'ship' | 'cancel' | 'reopen';

interface ConfirmActionDialogProps {
  open: boolean;
  intent: Intent;
  count: number;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const CONFIG: Record<
  Intent,
  {
    title: string;
    color: 'success' | 'error' | 'primary';
    verb: string;
    body: (n: number) => string;
  }
> = {
  ship: {
    title: 'Ship orders',
    color: 'success',
    verb: 'Ship',
    body: (n) => `Mark ${pluralize(n, 'order')} as shipped and move them to history.`,
  },
  cancel: {
    title: 'Cancel orders',
    color: 'error',
    verb: 'Cancel',
    body: (n) => `Cancel ${pluralize(n, 'order')} and move them to history.`,
  },
  reopen: {
    title: 'Reopen orders',
    color: 'primary',
    verb: 'Reopen',
    body: (n) => `Move ${pluralize(n, 'order')} back to the open queue.`,
  },
};

export function ConfirmActionDialog({
  open,
  intent,
  count,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [busy, setBusy] = useState(false);
  const cfg = CONFIG[intent];

  useEffect(() => {
    if (open) setBusy(false);
  }, [open]);

  const confirmAction = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{cfg.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {cfg.body(count)} It will be recorded under your name.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} disabled={busy}>
          Back
        </Button>
        <Button variant="contained" color={cfg.color} disabled={busy} onClick={confirmAction}>
          {busy ? 'Working…' : `${cfg.verb} ${count}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
