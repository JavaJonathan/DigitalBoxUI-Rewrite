import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Slide from '@mui/material/Slide';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface SelectionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

export function SelectionBar({ count, onClear, children }: SelectionBarProps) {
  return (
    <Slide in={count > 0} direction="up" mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: { xs: 16, md: 'calc(232px + (100vw - 232px) / 2)' },
          transform: { md: 'translateX(-50%)' },
          right: { xs: 16, md: 'auto' },
          zIndex: (t) => t.zIndex.snackbar,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 3,
          bgcolor: 'surface.panel',
          border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
          boxShadow: 'var(--db-shadow-lg)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              px: 0.5,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '0.6875rem',
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </Box>
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>selected</Typography>
          <IconButton size="small" onClick={onClear} aria-label="Clear selection">
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Box>

        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>{children}</Box>
      </Box>
    </Slide>
  );
}
