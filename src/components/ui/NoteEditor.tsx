import type { KeyboardEvent } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { NOTE_MAX_LENGTH } from '../../lib/constants';

interface NoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  busy?: boolean;
  minRows?: number;
  autoFocus?: boolean;
  /** Extra key handling on the field, e.g. the popover's Cmd/Ctrl+Enter and Esc. */
  onKeyDown?: (e: KeyboardEvent) => void;
}

/** Controlled note textarea + character counter + Cancel/Save row. State lives in the parent. */
export function NoteEditor({
  value,
  onChange,
  onSave,
  onCancel,
  busy = false,
  minRows = 3,
  autoFocus = false,
  onKeyDown,
}: NoteEditorProps) {
  return (
    <Stack spacing={1}>
      <TextField
        autoFocus={autoFocus}
        multiline
        minRows={minRows}
        maxRows={8}
        size="small"
        fullWidth
        placeholder="e.g. fragile — call before ship"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        slotProps={{ htmlInput: { maxLength: NOTE_MAX_LENGTH } }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {value.length}/{NOTE_MAX_LENGTH}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Button size="small" variant="text" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={onSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
