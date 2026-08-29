import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../auth/AuthContext';
import { useOnlineUsers } from '../../realtime/RealtimeContext';

/** First letters of the first two words, else the first two characters. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || '?').toUpperCase();
}

/**
 * The live "who's on" roster in the sidebar. Current user first, then everyone else by name,
 * each with a pulsing presence dot. Hidden only when the hub isn't connected at all.
 */
export function SidebarPresence() {
  const online = useOnlineUsers();
  const { user } = useAuth();

  if (online.length === 0) return null;

  const ordered = [...online].sort((a, b) => {
    if (a.userId === user?.id) return -1;
    if (b.userId === user?.id) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <Box
      sx={{
        mt: 3,
        pt: 3.5,
        borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
      }}
    >
      <Box sx={{ px: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'text.disabled',
          }}
        >
          Online now
        </Typography>
        <Box
          sx={{
            minWidth: 18,
            height: 18,
            px: 1,
            borderRadius: '9px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.6875rem',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            bgcolor: 'surface.sunken',
            color: 'text.secondary',
          }}
        >
          {ordered.length}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          maxHeight: 300,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        {ordered.map((u) => {
          const isSelf = u.userId === user?.id;
          return (
            <Box
              key={u.userId}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                pl: 3,
                pr: 2.5,
                height: 44,
                borderRadius: 1.5,
              }}
            >
              <Box sx={{ position: 'relative', flexShrink: 0, width: 30, height: 30 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    bgcolor: isSelf ? 'primary.main' : 'surface.sunken',
                    color: isSelf ? 'primary.contrastText' : 'text.secondary',
                    border: isSelf
                      ? 'none'
                      : (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                  }}
                >
                  {initials(u.displayName)}
                </Box>
                <Box
                  className="db-presence-dot"
                  sx={{
                    position: 'absolute',
                    right: -1,
                    bottom: -1,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: (t) => `2px solid ${(t.vars ?? t).palette.surface.panel}`,
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: isSelf ? 600 : 500,
                    color: 'text.primary',
                    lineHeight: 1.3,
                  }}
                  noWrap
                >
                  {u.displayName}
                </Typography>
                {isSelf && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.6875rem', color: 'text.disabled', flexShrink: 0 }}
                  >
                    you
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
