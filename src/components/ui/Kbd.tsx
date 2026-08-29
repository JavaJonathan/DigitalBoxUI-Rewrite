import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface KbdProps {
  children: ReactNode;
  /** `md` (default) matches the search field; `sm` is used in tighter spots like the sidebar. */
  size?: 'sm' | 'md';
  sx?: SxProps<Theme>;
}

/** A keyboard-key chip, e.g. `<Kbd>/</Kbd>`. */
export function Kbd({ children, size = 'md', sx }: KbdProps) {
  const sm = size === 'sm';
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-block',
        fontFamily: 'var(--db-mono)',
        fontSize: sm ? '0.6875rem' : '0.75rem',
        lineHeight: 1,
        px: sm ? 0.5 : 0.75,
        py: sm ? 0.25 : 0.5,
        borderRadius: sm ? 0.625 : 0.75,
        border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
        bgcolor: 'surface.sunken',
        color: sm ? 'text.secondary' : 'text.disabled',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
