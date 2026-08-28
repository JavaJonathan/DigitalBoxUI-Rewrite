import { useRef, useState, type DragEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { uploadPackingSlips } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import type { UploadResponse } from '../types';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...pdfs.filter((f) => !seen.has(f.name + f.size))];
    });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await uploadPackingSlips(files);
      setResult(response);
      setFiles([]);
      onUploaded();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Upload failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>Upload packing slips</DialogTitle>
      <DialogContent>
        <Box
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: dragging ? 'primary.light' : 'transparent',
          }}
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography sx={{ mt: 1 }}>Drop PDF packing slips here, or click to choose</Typography>
          <Typography variant="caption" color="text.secondary">
            Up to 50 files, 15 MB each
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </Box>

        {files.length > 0 && (
          <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
            {files.map((file) => (
              <ListItem
                key={file.name + file.size}
                secondaryAction={
                  <Button
                    size="small"
                    onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}
                  >
                    Remove
                  </Button>
                }
              >
                <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(0)} KB`} />
              </ListItem>
            ))}
          </List>
        )}

        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip color="success" size="small" label={`${result.created} created`} />
              <Chip size="small" label={`${result.duplicates} duplicate`} />
              {result.errors > 0 && <Chip color="error" size="small" label={`${result.errors} error`} />}
            </Box>
            <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
              {result.files.map((f, i) => (
                <ListItem key={`${f.fileName}-${i}`}>
                  <ListItemText
                    primary={f.fileName}
                    secondary={
                      f.outcome === 'created'
                        ? `Order ${f.orderNumber || '(no #)'} · ${f.parseStatus}`
                        : `${f.outcome}${f.message ? ` — ${f.message}` : ''}`
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={busy}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button variant="contained" onClick={handleUpload} disabled={busy || files.length === 0}>
            Upload {files.length > 0 ? `(${files.length})` : ''}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
