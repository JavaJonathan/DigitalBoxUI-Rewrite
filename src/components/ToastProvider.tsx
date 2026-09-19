import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Slide, { type SlideProps } from '@mui/material/Slide';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { SIDEBAR_WIDTH } from '../lib/layout';
import { EASE_BACK_OUT } from '../lib/constants';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  notify: (message: string, severity?: Severity) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const SlideDown = (props: SlideProps) => (
  <Slide {...props} direction="down" easing={{ enter: EASE_BACK_OUT, exit: 'ease-in' }} />
);

const CONFIG: Record<Severity, { Icon: typeof CheckCircleRoundedIcon; bg: string; fg: string }> = {
  success: { Icon: CheckCircleRoundedIcon, bg: 'success.main', fg: 'success.contrastText' },
  error: { Icon: ErrorRoundedIcon, bg: 'error.main', fg: 'error.contrastText' },
  warning: { Icon: WarningRoundedIcon, bg: 'warning.main', fg: 'warning.contrastText' },
  info: { Icon: InfoRoundedIcon, bg: 'info.main', fg: 'info.contrastText' },
};

/** How long each severity stays up before auto-dismiss. Errors linger. */
const DURATION: Record<Severity, number> = {
  success: 4500,
  info: 4500,
  warning: 6500,
  error: 9000,
};

/**
 * Cap on queued toasts. Ship/cancel and the realtime feed can both fire at once, and a burst
 * of errors must not lock the operator behind a minute of backlog.
 */
const MAX_QUEUE = 3;

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  // A queue, not a single slot: a second notify() used to replace the first mid-read.
  const [items, setItems] = useState<Toast[]>([]);

  const notify = useCallback((message: string, severity: Severity = 'info') => {
    setItems((prev) =>
      // collapse an immediate repeat, e.g. the same error retried
      prev.at(-1)?.message === message
        ? prev
        : [...prev, { id: ++seq, message, severity }].slice(-MAX_QUEUE),
    );
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  const close = () => setItems((prev) => prev.slice(1));

  const current = items[0];
  const cfg = CONFIG[current?.severity ?? 'info'];

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        // Keying by id restarts autoHideDuration and replays the slide for each message, so
        // the queue drains without an effect (which would trip react(set-state-in-effect)).
        key={current?.id}
        open={current !== undefined}
        autoHideDuration={DURATION[current?.severity ?? 'info']}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') close();
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slots={{ transition: SlideDown }}
        // nudge the centre past the sidebar so it sits over the content, like the SelectionBar
        sx={{ top: { xs: 16, sm: 28 }, left: { md: `calc(50% + ${SIDEBAR_WIDTH / 2}px)` } }}
      >
        <Box
          role="alert"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3.5,
            minWidth: { xs: 'calc(100vw - 32px)', sm: 400 },
            maxWidth: 600,
            pl: 4.5,
            pr: 2.5,
            py: 3.5,
            borderRadius: 'var(--db-radius-lg)',
            bgcolor: cfg.bg,
            color: cfg.fg,
            boxShadow: 'var(--db-shadow-lg)',
          }}
        >
          <cfg.Icon fontSize="large" sx={{ flexShrink: 0 }} />
          <Box sx={{ flex: 1, fontSize: '1rem', fontWeight: 600, lineHeight: 1.35 }}>
            {current?.message}
          </Box>
          <IconButton
            onClick={close}
            aria-label="Dismiss"
            sx={{
              color: 'inherit',
              opacity: 0.8,
              flexShrink: 0,
              // currentColor is the severity's contrastText, so this scrim stays visible on the
              // light amber warning bar in dark mode, where a white one nearly vanishes.
              '&:hover': {
                opacity: 1,
                bgcolor: 'color-mix(in srgb, currentColor 18%, transparent)',
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
