import { useEffect, useState } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const MAX = 500;

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
      <Typography variant="caption" sx={{ color: 'text.disabled', px: 0.5 }}>
        Note · {orderNumber || 'order'}
      </Typography>
      <TextField
        autoFocus
        multiline
        minRows={3}
        maxRows={8}
        fullWidth
        size="small"
        placeholder="e.g. fragile — call before ship"
        value={text}
        onChange={(e) => setText(e.target.value)}
        slotProps={{ htmlInput: { maxLength: MAX } }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
          if (e.key === 'Escape' && !busy) onClose();
        }}
        sx={{ mt: 0.5 }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {text.length}/{MAX}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" variant="text" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
}
