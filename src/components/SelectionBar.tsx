import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { SIDEBAR_WIDTH } from '../lib/layout';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

export function SelectionBar({ count, onClear, children }: SelectionBarProps) {
  return (
    // Full-width strip that only centres the pill — MUI's <Slide> writes an inline
    // `transform`, so centring the pill itself via `translateX(-50%)` doesn't survive.
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 20, md: 36 },
        left: { xs: 12, md: `${SIDEBAR_WIDTH}px` },
        right: 12,
        display: 'flex',
        justifyContent: 'center',
        zIndex: (t) => t.zIndex.snackbar,
        pointerEvents: 'none',
      }}
    >
      <Slide
        in={count > 0}
        direction="up"
        mountOnEnter
        unmountOnExit
        timeout={{ enter: 340, exit: 180 }}
        easing={{ enter: 'cubic-bezier(0.34, 1.5, 0.64, 1)', exit: 'ease-in' }}
      >
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: '12px', sm: '20px' },
            pl: '20px',
            pr: '16px',
            py: '14px',
            borderRadius: '16px',
            bgcolor: 'surface.panel',
            border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
            boxShadow: (t) =>
              `0 0 0 4px color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 22%, transparent), var(--db-shadow-lg)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box
              sx={{
                minWidth: 28,
                height: 28,
                px: '6px',
                borderRadius: '8px',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </Box>
            <Typography
              sx={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'text.primary',
                whiteSpace: 'nowrap',
              }}
            >
              selected
            </Typography>
            <IconButton
              size="small"
              onClick={onClear}
              aria-label="Clear selection"
              sx={{ ml: '2px' }}
            >
              <CloseRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: '2px' }} />

          <Box sx={{ display: 'flex', gap: '10px' }}>{children}</Box>
        </Box>
      </Slide>
    </Box>
  );
}
