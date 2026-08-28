import { type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';
import { BRAND_GRADIENT, SURFACE_SUBTLE } from '../theme';

interface AppLayoutProps {
  children: ReactNode;
  /** Extra controls rendered on the right of the app bar (e.g. the upload button). */
  actions?: ReactNode;
}

const NAV = [
  { label: 'Queue', to: '/' },
  { label: 'History', to: '/history' },
];

export function AppLayout({ children, actions }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE_SUBTLE }}>
      <AppBar position="sticky" sx={{ background: BRAND_GRADIENT }}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 800,
              fontSize: 20,
              color: '#fff',
              textDecoration: 'none',
              mr: 2,
            }}
          >
            {'<Digital Box />'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {NAV.map((item) => {
              const active =
                item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
              return (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    color: '#fff',
                    opacity: active ? 1 : 0.75,
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {actions}

          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, ml: 1 }}>
            {user?.username}
          </Typography>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ color: '#fff', opacity: 0.85 }}
          >
            Sign out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
