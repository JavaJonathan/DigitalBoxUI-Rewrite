import { useEffect, useMemo, useState } from 'react';
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
import { UPLOAD_MAX_FILES, UPLOAD_LIST_PREVIEW } from '../lib/constants';
import { Mono } from './ui/Mono';
import { FileDropzone } from './ui/FileDropzone';
import type { UploadResponse } from '../types';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadDialog({ open, onClose, onUploaded }: UploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFiles([]);
    setProgress(null);
    setResult(null);
    setError(null);
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const addFiles = (incoming: FileList) => {
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    );
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const next = [...prev, ...pdfs.filter((f) => !seen.has(f.name + f.size))];
      // Client-side guard — anything past the cap is dropped; the render shows a note when hit.
      return next.length > UPLOAD_MAX_FILES ? next.slice(0, UPLOAD_MAX_FILES) : next;
    });
  };

  const totalBytes = useMemo(() => files.reduce((n, f) => n + f.size, 0), [files]);

  // Surface problems (errors, then duplicates) ahead of the created rows, so the ones that
  // need attention stay visible even when the list is capped at UPLOAD_LIST_PREVIEW.
  const orderedResults = useMemo(() => {
    if (!result) return [];
    const rank = (outcome: string) => (outcome === 'created' ? 2 : outcome === 'duplicate' ? 1 : 0);
    return [...result.files].sort((a, b) => rank(a.outcome) - rank(b.outcome));
  }, [result]);

  // A large upload runs for many minutes of sequential batches; warn before a tab close /
  // navigation throws away the batches still in flight (the committed ones are safe).
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  const upload = async () => {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: files.length });
    try {
      const response = await uploadPackingSlips(files, (done, total) =>
        setProgress({ done, total }),
      );
      setResult(response);
      setFiles([]);
      onUploaded();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Upload failed.'));
    } finally {
      setBusy(false);
      setProgress(null);
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
          <FileDropzone accept="application/pdf,.pdf" multiple disabled={busy} onFiles={addFiles}>
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
              Up to {UPLOAD_MAX_FILES.toLocaleString()} files · 15 MB each
            </Typography>
          </FileDropzone>
        )}

        {files.length > 0 && !result && (
          <Box sx={{ mt: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                mb: 0.75,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {files.length.toLocaleString()} {files.length === 1 ? 'file' : 'files'} ·{' '}
                {formatBytes(totalBytes)}
              </Typography>
              {files.length >= UPLOAD_MAX_FILES && (
                <Typography variant="caption" sx={{ color: 'warning.main' }}>
                  Maximum of {UPLOAD_MAX_FILES.toLocaleString()} reached
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                maxHeight: 220,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {files.slice(0, UPLOAD_LIST_PREVIEW).map((file) => (
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
              {files.length > UPLOAD_LIST_PREVIEW && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', textAlign: 'center', py: 0.75 }}
                >
                  + {(files.length - UPLOAD_LIST_PREVIEW).toLocaleString()} more not shown
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {busy && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant={progress ? 'determinate' : 'indeterminate'}
              value={progress ? (progress.done / progress.total) * 100 : undefined}
            />
            {progress && (
              <Typography sx={{ mt: 0.75, fontSize: '0.75rem', color: 'text.secondary' }}>
                Uploading {progress.done} / {progress.total}
              </Typography>
            )}
          </Box>
        )}
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
              {orderedResults.slice(0, UPLOAD_LIST_PREVIEW).map((f, i) => {
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
              {orderedResults.length > UPLOAD_LIST_PREVIEW && (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', textAlign: 'center', py: 0.75 }}
                >
                  + {(orderedResults.length - UPLOAD_LIST_PREVIEW).toLocaleString()} more
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="text" onClick={close} disabled={busy}>
          {result ? 'Done' : 'Cancel'}
        </Button>
        {!result && (
          <Button variant="contained" onClick={upload} disabled={busy || files.length === 0}>
            {files.length > 0 ? `Upload ${files.length}` : 'Upload'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
