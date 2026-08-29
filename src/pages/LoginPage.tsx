import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../api/client';
import { Logo } from '../components/Logo';
import { ColorModeToggle } from '../components/ColorModeToggle';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not sign in. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        bgcolor: 'surface.canvas',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: (t) =>
            `radial-gradient(60rem 40rem at 50% -10rem, ${(t.vars ?? t).palette.primary.main}14, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <ColorModeToggle />
      </Box>

      <Stack spacing={3} sx={{ width: '100%', maxWidth: 380, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={30} />
        </Box>

        <Paper
          sx={{
            p: 3.5,
            border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            borderRadius: 3.5,
            boxShadow: 'var(--db-shadow-md)',
          }}
        >
          <Typography variant="h3" sx={{ fontSize: '1.125rem' }}>
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Enter the shared warehouse credentials to continue.
          </Typography>

          <Stack component="form" spacing={2} sx={{ mt: 3 }} onSubmit={submit}>
            <TextField
              label="Username"
              required
              size="small"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              required
              size="small"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              endIcon={!submitting && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
              sx={{ mt: 0.5 }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </Paper>

        <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
          DigitalBox — warehouse fulfillment
        </Typography>
      </Stack>
    </Box>
  );
}
