import { useEffect, useMemo, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { UPLOAD_LIST_PREVIEW } from '../lib/constants';
import { pluralize } from '../lib/format';
import type { SlipStatus } from '../lib/slipFolder';
import type { SlipItem } from '../hooks/useSlipDelivery';

interface SlipDeliveryDialogProps {
  open: boolean;
  running: boolean;
  mode: 'folder' | 'download';
  folderName: string | null;
  /** Context line under the title, e.g. "Shipped 40 orders." when this follows a ship. */
  note: string | null;
  items: SlipItem[];
  onCancel: () => void;
  onClose: () => void;
  onRetryFailed: () => void;
  onRetryAll: () => void;
}

const ROW_HEIGHT = 36;

function StatusIcon({ status }: { status: SlipStatus }) {
  if (status === 'saved' || status === 'sent') {
    return <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'success.main' }} />;
  }
  if (status === 'failed') {
    return <ErrorOutlineRoundedIcon fontSize="small" sx={{ color: 'error.main' }} />;
  }
  if (status === 'working') {
    return <CircularProgress size={14} thickness={6} />;
  }
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        border: (t) => `1.5px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
      }}
    />
  );
}

export function SlipDeliveryDialog({
  open,
  running,
  mode,
  folderName,
  note,
  items,
  onCancel,
  onClose,
  onRetryFailed,
  onRetryAll,
}: SlipDeliveryDialogProps) {
  const folderMode = mode === 'folder';
  const activeRef = useRef<HTMLDivElement | null>(null);

  // A closing tab mid-run loses the slips still waiting; warn like the uploader does.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running]);

  const counts = useMemo(() => {
    const c = { done: 0, failed: 0, waiting: 0 };
    for (const it of items) {
      if (it.status === 'saved' || it.status === 'sent') c.done++;
      else if (it.status === 'failed') c.failed++;
      else c.waiting++;
    }
    return c;
  }, [items]);

  const total = items.length;
  const settled = counts.done + counts.failed;

  // Rows stay in their original order while running so nothing jumps under the cursor; once
  // finished, problems float to the top. Past the row cap the window follows the active row.
  const rows = useMemo(() => {
    const indexed = items.map((it, i) => ({ it, i }));
    if (!running) {
      const rank = (s: SlipStatus) => (s === 'failed' ? 0 : s === 'queued' ? 1 : 2);
      indexed.sort((a, b) => rank(a.it.status) - rank(b.it.status) || a.i - b.i);
      return {
        list: indexed.slice(0, UPLOAD_LIST_PREVIEW),
        from: 0,
        hidden: total - UPLOAD_LIST_PREVIEW,
      };
    }
    const firstOpen = Math.max(
      0,
      items.findIndex((it) => it.status === 'working' || it.status === 'queued'),
    );
    const from = Math.max(0, Math.min(firstOpen - 4, total - UPLOAD_LIST_PREVIEW));
    return {
      list: indexed.slice(from, from + UPLOAD_LIST_PREVIEW),
      from,
      hidden: total - UPLOAD_LIST_PREVIEW,
    };
  }, [items, running, total]);

  const activeIndex = items.findIndex((it) => it.status === 'working');
  useEffect(() => {
    if (running) activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [running, activeIndex]);

  const clean = !running && counts.failed === 0 && counts.waiting === 0;
  const stopped = !running && counts.waiting > 0;

  let title: string;
  if (running) title = folderMode ? 'Saving packing slips' : 'Sending packing slips';
  else if (clean) title = folderMode ? 'Packing slips saved' : 'Packing slips sent';
  else if (stopped) title = 'Stopped';
  else title = 'Finished with issues';

  let detail: string;
  if (running) {
    detail = folderMode
      ? `Writing to ${folderName ?? 'your folder'}`
      : 'Handing each file to your browser, one at a time';
  } else if (folderMode) {
    detail = `${counts.done} of ${total} saved to ${folderName ?? 'your folder'}`;
  } else {
    detail = `${counts.done} of ${total} sent to your browser`;
  }

  const tone = running ? 'primary' : clean ? 'success' : 'warning';

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, px: 6, pt: 5, pb: 4 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 'var(--db-radius-md)',
            display: 'grid',
            placeItems: 'center',
            color: `${tone}.main`,
            bgcolor: (t) =>
              `color-mix(in srgb, ${(t.vars ?? t).palette[tone].main} 12%, transparent)`,
          }}
        >
          {running ? (
            <CircularProgress size={20} thickness={5} />
          ) : clean ? (
            <CheckRoundedIcon />
          ) : (
            <WarningAmberRoundedIcon />
          )}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.3 }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', mt: 0.5 }}>
            {note ? `${note} ` : ''}
            {detail}.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={running} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 0 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }} className="db-mono">
            {settled} / {total}
          </Typography>
          {counts.failed > 0 && (
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'error.main' }}>
              {counts.failed} failed
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          color={!running && counts.failed > 0 ? 'warning' : 'primary'}
          value={total ? (settled / total) * 100 : 0}
          sx={{ mb: 3 }}
        />

        {!running && !folderMode && counts.done > 0 && (
          <Box
            sx={{
              display: 'flex',
              gap: 2.5,
              p: 3,
              mb: 3,
              borderRadius: 'var(--db-radius-md)',
              bgcolor: 'surface.sunken',
              color: 'text.secondary',
            }}
          >
            <InfoOutlinedIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.8125rem' }}>
              Files are in your Downloads folder. If some are missing, your browser may have blocked
              multiple downloads: allow them from the icon in the address bar, then choose Download
              again.
            </Typography>
          </Box>
        )}

        <Paper
          variant="outlined"
          sx={{ maxHeight: ROW_HEIGHT * 8, overflow: 'auto', overscrollBehavior: 'contain' }}
        >
          {rows.list.map(({ it, i }, n) => (
            <Box
              key={i}
              ref={it.status === 'working' ? activeRef : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                px: 3,
                minHeight: ROW_HEIGHT,
                py: it.status === 'failed' ? 1.5 : 0,
                borderTop: n === 0 ? 0 : (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                bgcolor:
                  it.status === 'working'
                    ? (t) =>
                        `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 6%, transparent)`
                    : undefined,
              }}
            >
              <Box sx={{ width: 16, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <StatusIcon status={it.status} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  className="db-mono"
                  noWrap
                  sx={{
                    fontSize: '0.75rem',
                    color: it.status === 'queued' ? 'text.tertiary' : 'text.primary',
                  }}
                >
                  {it.fileName}
                </Typography>
                {it.status === 'failed' && it.error && (
                  <Typography sx={{ fontSize: '0.6875rem', color: 'error.main' }}>
                    {it.error}
                  </Typography>
                )}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.6875rem',
                  flexShrink: 0,
                  color: it.status === 'failed' ? 'error.main' : 'text.tertiary',
                }}
              >
                {it.status === 'saved'
                  ? 'Saved'
                  : it.status === 'sent'
                    ? 'Sent'
                    : it.status === 'failed'
                      ? 'Failed'
                      : it.status === 'working'
                        ? 'Working'
                        : ''}
              </Typography>
            </Box>
          ))}
        </Paper>
        {rows.hidden > 0 && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.tertiary', textAlign: 'center', mt: 1.5 }}
          >
            Showing {rows.list.length} of {pluralize(total, 'slip')}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          {!running && !folderMode && (
            <Button variant="text" startIcon={<FileDownloadOutlinedIcon />} onClick={onRetryAll}>
              Download again
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {running ? (
            <Button variant="outlined" onClick={onCancel}>
              Stop
            </Button>
          ) : (
            <>
              {(counts.failed > 0 || counts.waiting > 0) && (
                <Button variant="outlined" onClick={onRetryFailed}>
                  {counts.failed > 0 ? 'Retry failed' : 'Resume'}
                </Button>
              )}
              <Button variant="contained" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
