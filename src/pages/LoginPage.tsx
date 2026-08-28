import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../api/client';
import { BRAND_GRADIENT, SURFACE_SUBTLE } from '../theme';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
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
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '1 1 50%',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_GRADIENT,
          color: '#fff',
          p: 6,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800, fontSize: 56 }}>
            {'<Digital Box />'}
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 18, color: 'rgba(255,255,255,0.85)' }}>
            Upload packing slips. Ship orders. Keep the queue moving.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: SURFACE_SUBTLE,
          px: 2,
          py: 6,
        }}
      >
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 400, p: 4, border: '1px solid #e2e8f0', borderRadius: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Use the shared warehouse login.
          </Typography>

          <Stack component="form" spacing={2.5} sx={{ mt: 3 }} onSubmit={handleSubmit}>
            <TextField
              label="Username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
