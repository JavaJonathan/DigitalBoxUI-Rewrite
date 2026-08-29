import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { NoteEditor } from '../ui/NoteEditor';

interface OrderNoteCardProps {
  notes: string | null;
  /** Persist the note; resolves once the order has been updated. */
  onSave: (notes: string | null) => Promise<void>;
}

export function OrderNoteCard({ notes, onSave }: OrderNoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const start = () => {
    setDraft(notes ?? '');
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave(draft.trim() ? draft.trim() : null);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          Note
        </Typography>
        {!editing && (
          <Button size="small" variant="text" onClick={start}>
            {notes ? 'Edit' : 'Add'}
          </Button>
        )}
      </Box>
      {editing ? (
        <NoteEditor
          value={draft}
          onChange={setDraft}
          onSave={save}
          onCancel={() => setEditing(false)}
          busy={busy}
          autoFocus
          minRows={2}
        />
      ) : (
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: notes ? 'text.primary' : 'text.disabled',
            whiteSpace: 'pre-wrap',
          }}
        >
          {notes || 'No note.'}
        </Typography>
      )}
    </Paper>
  );
}
