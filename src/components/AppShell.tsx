import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import { useAuth } from '../auth/AuthContext';
import { SIDEBAR_WIDTH } from '../lib/layout';
import { Logo, LogoMark } from './Logo';
import { ColorModeToggle } from './ColorModeToggle';

const NAV = [
  { label: 'Queue', to: '/', icon: InboxOutlinedIcon, match: (p: string) => p === '/' },
  { label: 'History', to: '/history', icon: HistoryOutlinedIcon, match: (p: string) => p.startsWith('/history') },
];

interface AppShellProps {
  title: ReactNode;
  /** small element next to the title, e.g. a count */
  titleMeta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** disable the default content padding (full-bleed pages) */
  disableGutters?: boolean;
  /**
   * Optional cap on the content width. Left undefined the content fills the
   * viewport (minus the gutters) — an ops tool has no reason to waste the pixels
   * on a wide monitor.
   */
  contentMax?: number;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: 64,
          px: '20px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        }}
      >
        <Logo size={28} />
      </Box>

      <Box
        component="nav"
        sx={{ flex: 1, px: '12px', pt: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}
      >
        <Typography
          sx={{
            px: '12px',
            mb: '6px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'text.disabled',
          }}
        >
          Warehouse
        </Typography>

        {NAV.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Box
              key={item.to}
              component={RouterLink}
              to={item.to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pl: '12px',
                pr: '10px',
                height: 46,
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: active ? 650 : 500,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active
                  ? (t) => `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 12%, transparent)`
                  : 'transparent',
                transition: 'background-color 120ms ease, color 120ms ease',
                '&:hover': {
                  bgcolor: active
                    ? (t) => `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 17%, transparent)`
                    : 'surface.hover',
                  color: active ? 'primary.main' : 'text.primary',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -12,
                  top: '50%',
                  width: 3,
                  height: 22,
                  borderRadius: '0 3px 3px 0',
                  bgcolor: 'primary.main',
                  transform: `translateY(-50%) scaleY(${active ? 1 : 0})`,
                  transition: 'transform 180ms cubic-bezier(0.34, 1.4, 0.64, 1)',
                },
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: '9px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: active
                    ? (t) => `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 20%, transparent)`
                    : 'surface.sunken',
                  color: active ? 'primary.main' : 'text.secondary',
                  transition: 'background-color 120ms ease, color 120ms ease',
                  '& svg': { fontSize: 19 },
                }}
              >
                <Icon />
              </Box>
              {item.label}
            </Box>
          );
        })}

        <Box sx={{ flex: 1 }} />

        <Typography
          sx={{
            px: '12px',
            pb: '4px',
            fontSize: '0.6875rem',
            color: 'text.disabled',
            display: { xs: 'none', md: 'block' },
          }}
        >
          Press{' '}
          <Box
            component="kbd"
            sx={{
              fontFamily: 'var(--db-mono)',
              fontSize: '0.6875rem',
              px: '5px',
              py: '1px',
              borderRadius: '5px',
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
              bgcolor: 'surface.sunken',
              color: 'text.secondary',
            }}
          >
            /
          </Box>{' '}
          to search
        </Typography>
      </Box>

      <Box sx={{ p: '12px', borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}` }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            p: '12px',
            borderRadius: '12px',
            border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            bgcolor: 'surface.sunken',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              {(user?.username ?? '?').slice(0, 2)}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3 }} noWrap>
                {user?.username}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', lineHeight: 1.3 }} noWrap>
                Shared warehouse login
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: '8px',
              borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            }}
          >
            <ColorModeToggle />
            <Tooltip title="Sign out" placement="top" arrow>
              <IconButton onClick={signOut} aria-label="Sign out">
                <LogoutOutlinedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function AppShell({
  title,
  titleMeta,
  actions,
  children,
  disableGutters = false,
  contentMax,
}: AppShellProps) {
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'surface.canvas' }}>
      {isDesktop ? (
        <Box
          component="aside"
          sx={{
            position: 'fixed',
            inset: '0 auto 0 0',
            width: SIDEBAR_WIDTH,
            bgcolor: 'surface.panel',
            borderRight: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            zIndex: (t) => t.zIndex.appBar,
          }}
        >
          <SidebarContent />
        </Box>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH, bgcolor: 'surface.panel', backgroundImage: 'none' } } }}
        >
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ pl: isDesktop ? `${SIDEBAR_WIDTH}px` : 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (t) => t.zIndex.appBar - 1,
            bgcolor: (t) => `color-mix(in srgb, ${(t.vars ?? t).palette.surface.canvas} 82%, transparent)`,
            backdropFilter: 'saturate(180%) blur(8px)',
            borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
          }}
        >
          <Box
            sx={{
              height: 64,
              width: '100%',
              maxWidth: contentMax ?? 'none',
              mx: 'auto',
              px: { xs: 3, sm: 4, lg: 6 },
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {!isDesktop && (
              <>
                <IconButton size="small" edge="start" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                  <MenuOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <LogoMark size={22} />
              </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.25, minWidth: 0 }}>
              <Typography variant="h4" component="h1" noWrap sx={{ fontSize: '1.0625rem' }}>
                {title}
              </Typography>
              {titleMeta}
            </Box>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>
          </Box>
        </Box>

        <Box
          key={pathname}
          component="main"
          className="db-fade-in"
          sx={{
            flex: 1,
            px: disableGutters ? 0 : { xs: 3, sm: 4, lg: 6 },
            py: disableGutters ? 0 : { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: disableGutters ? 'none' : (contentMax ?? 'none'),
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
