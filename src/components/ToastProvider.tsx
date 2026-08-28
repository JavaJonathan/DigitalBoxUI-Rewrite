import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Slide, { type SlideProps } from '@mui/material/Slide';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  notify: (message: string, severity?: Severity) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const SlideUp = (props: SlideProps) => <Slide {...props} direction="up" />;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ open: false, message: '', severity: 'info' });

  const notify = useCallback((message: string, severity: Severity = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  const close = () => setState((s) => ({ ...s, open: false }));

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={4500}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slots={{ transition: SlideUp }}
      >
        <Alert severity={state.severity} variant="standard" onClose={close} sx={{ minWidth: 300 }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
