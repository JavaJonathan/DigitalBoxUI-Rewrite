import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import { EASE_BACK_OUT } from '../../lib/constants';

export interface NavItem {
  label: string;
  to: string;
  icon: SvgIconComponent;
  match: (pathname: string) => boolean;
}

/** primary colour at `pct%` opacity — the shared tint for the active nav row. */
const tint = (t: Theme, pct: number) =>
  `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} ${pct}%, transparent)`;

export function SidebarNavItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Box
      component={RouterLink}
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        pl: 3,
        pr: 2.5,
        height: 46,
        borderRadius: 1.5,
        textDecoration: 'none',
        fontSize: '0.9375rem',
        fontWeight: active ? 650 : 500,
        color: active ? 'primary.main' : 'text.secondary',
        bgcolor: active ? (t) => tint(t, 12) : 'transparent',
        transition: 'background-color 120ms ease, color 120ms ease',
        '&:hover': {
          bgcolor: active ? (t) => tint(t, 17) : 'surface.hover',
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
          transition: `transform 180ms ${EASE_BACK_OUT}`,
        },
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: '9px', // odd value on the 8px grid — kept explicit
          display: 'grid',
          placeItems: 'center',
          bgcolor: active ? (t) => tint(t, 20) : 'surface.sunken',
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
}
