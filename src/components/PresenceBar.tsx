import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { useAuth } from '../auth/AuthContext';
import { useOnlineUsers } from '../realtime/RealtimeContext';

/** First letters of the first two words, else the first two characters. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || '?').toUpperCase();
}

const MAX_SHOWN = 5;

/**
 * A small overlapping avatar stack in the topbar showing who else is on. Renders nothing when
 * the current user is alone — there's no collaboration to signal.
 */
export function PresenceBar() {
  const online = useOnlineUsers();
  const { user } = useAuth();

  if (online.length <= 1) return null;

  const ordered = [...online].sort((a, b) => {
    if (a.userId === user?.id) return -1;
    if (b.userId === user?.id) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const shown = ordered.slice(0, MAX_SHOWN);
  const overflow = ordered.length - shown.length;
  const roster = ordered
    .map((u) => (u.userId === user?.id ? `${u.displayName} (you)` : u.displayName))
    .join(', ');

  return (
    <Tooltip title={`Online now: ${roster}`} arrow>
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
        {shown.map((u, i) => {
          const isSelf = u.userId === user?.id;
          return (
            <Box
              key={u.userId}
              aria-hidden
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.625rem',
                fontWeight: 700,
                lineHeight: 1,
                userSelect: 'none',
                bgcolor: isSelf ? 'primary.main' : 'surface.borderStrong',
                color: isSelf ? 'primary.contrastText' : 'text.secondary',
                border: (t) => `2px solid ${(t.vars ?? t).palette.surface.canvas}`,
                ml: i === 0 ? 0 : '-8px',
              }}
            >
              {initials(u.displayName)}
            </Box>
          );
        })}
        {overflow > 0 && (
          <Box sx={{ ml: 1.25, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
            +{overflow}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
