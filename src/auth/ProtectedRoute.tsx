import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from './AuthContext';
import type { UserRole } from '../types';

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  /** When set, a signed-in user without this role is bounced to the queue. */
  requireRole?: UserRole;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
