import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const SIDEBAR_WIDTH = 232;

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
        bottom: { xs: 16, md: 28 },
        left: { xs: 12, md: `${SIDEBAR_WIDTH}px` },
        right: 12,
        display: 'flex',
        justifyContent: 'center',
        zIndex: (t) => t.zIndex.snackbar,
        pointerEvents: 'none',
      }}
    >
      <Slide in={count > 0} direction="up" mountOnEnter unmountOnExit>
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pl: 2,
            pr: 1.5,
            py: 1.25,
            borderRadius: 3,
            bgcolor: 'surface.panel',
            border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            boxShadow: 'var(--db-shadow-lg)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                minWidth: 22,
                height: 22,
                px: 0.625,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {count}
            </Box>
            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
              selected
            </Typography>
            <IconButton size="small" onClick={onClear} aria-label="Clear selection">
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ my: 0.25 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>{children}</Box>
        </Box>
      </Slide>
    </Box>
  );
}
