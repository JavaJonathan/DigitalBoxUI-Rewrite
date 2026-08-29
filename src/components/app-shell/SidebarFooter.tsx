import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { ColorModeToggle } from '../ColorModeToggle';
import { PoweredByHsl } from '../PoweredByHsl';

/** Two-letter avatar seed from a display name: first letters of the first two words, else first two chars. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || '?').toUpperCase();
}

export function SidebarFooter({
  displayName,
  role,
  onSignOut,
}: {
  displayName: string | undefined;
  role: string | undefined;
  onSignOut: () => void;
}) {
  const name = displayName || 'Signed in';
  const roleLabel = role === 'Admin' ? 'Administrator' : 'Warehouse staff';
  return (
    <Box sx={{ p: 3, borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}` }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 3,
          borderRadius: 1.5,
          border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
          bgcolor: 'surface.sunken',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {initials(name)}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 }} noWrap>
              {name}
            </Typography>
            <Typography
              sx={{ fontSize: '0.75rem', color: 'text.disabled', lineHeight: 1.3 }}
              noWrap
            >
              {roleLabel}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2,
            borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
          }}
        >
          <ColorModeToggle />
          <Tooltip title="Sign out" placement="top" arrow>
            <IconButton onClick={onSignOut} aria-label="Sign out">
              <LogoutOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
        <PoweredByHsl size={15} />
      </Box>
    </Box>
  );
}
