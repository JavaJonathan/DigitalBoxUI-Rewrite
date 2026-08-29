import { useRef, useState, type DragEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import { uploadPackingSlips } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { formatBytes } from '../lib/format';
import { Mono } from './ui/Mono';
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <DialogTitle>Upload packing slips</DialogTitle>
        <IconButton size="small" onClick={close} disabled={busy} aria-label="Close">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent>
        {!result && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '1.5px dashed',
              borderColor: dragging ? 'primary.main' : 'surface.borderStrong',
              borderRadius: 2.5,
              px: 3,
              py: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragging ? 'primary.light' : 'surface.inset',
              transition: 'border-color 120ms ease, background-color 120ms ease',
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                mx: 'auto',
                mb: 1.25,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'surface.panel',
                border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                color: 'text.secondary',
              }}
            >
              <UploadFileOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 550 }}>
              Drop PDFs here, or click to browse
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Up to 50 files · 15 MB each
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
        )}

        {files.length > 0 && !result && (
          <Box
            sx={{
              mt: 1.5,
              maxHeight: 220,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            {files.map((file) => (
              <Box
                key={file.name + file.size}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 0.875,
                  borderRadius: 1.75,
                  bgcolor: 'surface.sunken',
                }}
              >
                <PictureAsPdfOutlinedIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
                <Typography sx={{ flex: 1, fontSize: '0.8125rem' }} noWrap>
                  {file.name}
                </Typography>
                <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
                  {formatBytes(file.size)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFiles((prev) => prev.filter((f) => f !== file))}
                  aria-label="Remove file"
                  sx={{ p: 0.25 }}
                >
                  <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {busy && <LinearProgress sx={{ mt: 2 }} />}
        {error && (
          <Typography sx={{ mt: 2, fontSize: '0.8125rem', color: 'error.main' }}>
            {error}
          </Typography>
        )}

        {result && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5, fontSize: '0.8125rem' }}>
              <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                {result.created} added
              </Box>
              <Box component="span" sx={{ color: 'text.secondary' }}>
                {result.duplicates} duplicate
              </Box>
              {result.errors > 0 && (
                <Box component="span" sx={{ color: 'error.main', fontWeight: 600 }}>
                  {result.errors} failed
                </Box>
              )}
            </Box>
            <Box
              sx={{
                maxHeight: 260,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {result.files.map((f, i) => {
                const ok = f.outcome === 'created';
                const dup = f.outcome === 'duplicate';
                return (
                  <Box
                    key={`${f.fileName}-${i}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.25,
                      px: 1.25,
                      py: 0.875,
                      borderRadius: 1.75,
                      bgcolor: 'surface.sunken',
                    }}
                  >
                    {ok ? (
                      <CheckCircleRoundedIcon
                        sx={{ fontSize: 16, color: 'success.main', mt: 0.25 }}
                      />
                    ) : dup ? (
                      <RemoveCircleOutlineRoundedIcon
                        sx={{ fontSize: 16, color: 'text.disabled', mt: 0.25 }}
                      />
                    ) : (
                      <ErrorOutlineRoundedIcon
                        sx={{ fontSize: 16, color: 'error.main', mt: 0.25 }}
                      />
                    )}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: '0.8125rem' }} noWrap>
                        {f.fileName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
                        {ok ? (
                          <>
                            <Mono muted>{f.orderNumber || 'no order #'}</Mono>
                            {' · '}
                            {f.parseStatus}
                          </>
                        ) : (
                          f.message || f.outcome
                        )}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={close} disabled={busy}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button variant="contained" onClick={handleUpload} disabled={busy || files.length === 0}>
            {files.length > 0 ? `Upload ${files.length}` : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
