import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { useAuth } from '../auth/AuthContext';
import { SIDEBAR_WIDTH } from '../lib/layout';
import { Logo, LogoMark } from './Logo';
import { Kbd } from './ui/Kbd';
import { SidebarNavItem, type NavItem } from './app-shell/SidebarNavItem';
import { SidebarFooter } from './app-shell/SidebarFooter';

const NAV: NavItem[] = [
  { label: 'Queue', to: '/', icon: InboxOutlinedIcon, match: (p) => p === '/' },
  {
    label: 'History',
    to: '/history',
    icon: HistoryOutlinedIcon,
    match: (p) => p.startsWith('/history'),
  },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Users', to: '/users', icon: PeopleOutlinedIcon, match: (p) => p.startsWith('/users') },
];

interface AppShellProps {
  title: ReactNode;
  /** small element next to the title, e.g. a count */
  titleMeta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const nav = user?.role === 'Admin' ? [...NAV, ...ADMIN_NAV] : NAV;

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          height: 64,
          px: 5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        }}
      >
        <Logo size={28} />
      </Box>

      <Box
        component="nav"
        sx={{ flex: 1, px: 3, pt: 4, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <Typography
          sx={{
            px: 3,
            mb: 1.5,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: 'text.disabled',
          }}
        >
          Warehouse
        </Typography>

        {nav.map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            active={item.match(location.pathname)}
            onNavigate={onNavigate}
          />
        ))}

        <Box sx={{ flex: 1 }} />

        <Typography
          sx={{
            px: 3,
            pb: 1,
            fontSize: '0.6875rem',
            color: 'text.disabled',
            display: { xs: 'none', md: 'block' },
          }}
        >
          Press <Kbd size="sm">/</Kbd> to search
        </Typography>
      </Box>

      <SidebarFooter displayName={user?.displayName} role={user?.role} onSignOut={signOut} />
    </Box>
  );
}

export function AppShell({ title, titleMeta, actions, children }: AppShellProps) {
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
          slotProps={{
            paper: {
              sx: { width: SIDEBAR_WIDTH, bgcolor: 'surface.panel', backgroundImage: 'none' },
            },
          }}
        >
          <SidebarContent onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
      )}

      <Box
        sx={{
          pl: isDesktop ? `${SIDEBAR_WIDTH}px` : 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (t) => t.zIndex.appBar - 1,
            bgcolor: (t) =>
              `color-mix(in srgb, ${(t.vars ?? t).palette.surface.canvas} 82%, transparent)`,
            backdropFilter: 'saturate(180%) blur(8px)',
            borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
          }}
        >
          <Box
            sx={{
              height: 64,
              width: '100%',
              px: { xs: 3, sm: 4, lg: 6 },
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {!isDesktop && (
              <>
                <IconButton
                  size="small"
                  edge="start"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation"
                >
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
            px: { xs: 3, sm: 4, lg: 6 },
            py: { xs: 3, sm: 4 },
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
