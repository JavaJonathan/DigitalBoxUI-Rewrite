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
import { Logo, LogoMark } from './Logo';
import { ColorModeToggle } from './ColorModeToggle';

const SIDEBAR_WIDTH = 232;

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
          height: 56,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        }}
      >
        <Logo />
      </Box>

      <Box component="nav" sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {NAV.map((item) => {
          const active = item.match(location.pathname);
          const Icon = item.icon;
          return (
            <Box
              key={item.to}
              component={RouterLink}
              to={item.to}
              onClick={onNavigate}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.25,
                height: 34,
                borderRadius: 1.75,
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 500,
                color: active ? 'text.primary' : 'text.secondary',
                bgcolor: active ? 'surface.sunken' : 'transparent',
                transition: 'background-color 100ms ease, color 100ms ease',
                '&:hover': { bgcolor: active ? 'surface.sunken' : 'surface.hover', color: 'text.primary' },
                '& svg': { fontSize: 18, color: active ? 'primary.main' : 'inherit' },
              }}
            >
              <Icon />
              {item.label}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 1.5, borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 0.75, py: 0.5 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'surface.sunken',
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontWeight: 650,
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {(user?.username ?? '?').slice(0, 2)}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 550, lineHeight: 1.3 }} noWrap>
              {user?.username}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: 'text.disabled', lineHeight: 1.3 }} noWrap>
              Shared warehouse login
            </Typography>
          </Box>
          <ColorModeToggle />
          <Tooltip title="Sign out" placement="top" arrow>
            <IconButton size="small" onClick={signOut} aria-label="Sign out">
              <LogoutOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
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
              height: 56,
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
              <Typography variant="h4" component="h1" noWrap sx={{ fontSize: '0.9375rem' }}>
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
