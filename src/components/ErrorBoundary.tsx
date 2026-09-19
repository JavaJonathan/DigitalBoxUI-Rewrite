import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { Logo } from './Logo';

interface State {
  failed: boolean;
}

class Boundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Console only. The message can carry server-derived text, so it never reaches the DOM.
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
          bgcolor: 'surface.canvas',
        }}
      >
        <Stack spacing={3} sx={{ width: '100%', maxWidth: 420 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Logo size={30} />
          </Box>
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <ErrorOutlineRoundedIcon fontSize="large" sx={{ color: 'error.main' }} />
            <Typography variant="h4" sx={{ mt: 1.5 }}>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              DigitalBox hit an unexpected error and stopped rendering this page. Reloading usually
              clears it.
            </Typography>
            <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
              Reload
            </Button>
          </Paper>
        </Stack>
      </Box>
    );
  }
}

/**
 * Remounts the boundary on navigation, so a route-level throw doesn't leave the user stuck on
 * the error screen after they click something else. Class components can't use hooks, hence
 * the wrapper.
 */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
}
