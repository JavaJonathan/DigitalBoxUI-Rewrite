import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/ui/EmptyState';

/**
 * Shown both for an unknown URL and for an admin-only route a non-admin asked for, so the two
 * are indistinguishable and those routes keep reading as non-existent.
 */
export function NotFoundPage() {
  return (
    <AppShell title="Not found">
      <Paper variant="outlined">
        <EmptyState
          icon={<SearchOffRoundedIcon />}
          title="Page not found"
          description="That page doesn't exist, or you don't have access to it."
          action={
            <Button variant="contained" size="small" component={RouterLink} to="/">
              Back to queue
            </Button>
          }
        />
      </Paper>
    </AppShell>
  );
}
