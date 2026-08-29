import { useEffect, useState } from 'react';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { NoteEditor } from './ui/NoteEditor';

interface NotePopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  initialNote: string | null;
  orderNumber: string;
  onClose: () => void;
  onSave: (notes: string | null) => Promise<void> | void;
}

export function NotePopover({
  open,
  anchorEl,
  initialNote,
  orderNumber,
  onClose,
  onSave,
}: NotePopoverProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialNote ?? '');
      setBusy(false);
    }
  }, [open, initialNote]);

  const save = async () => {
    setBusy(true);
    try {
      await onSave(text.trim() ? text.trim() : null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={busy ? undefined : onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { width: 320, p: 1.5 } } }}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', px: 0.5, mb: 0.5, display: 'block' }}
      >
        Note · {orderNumber || 'order'}
      </Typography>
      <NoteEditor
        value={text}
        onChange={setText}
        onSave={save}
        onCancel={onClose}
        busy={busy}
        autoFocus
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
          if (e.key === 'Escape' && !busy) onClose();
        }}
      />
    </Popover>
  );
}
