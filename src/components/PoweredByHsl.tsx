import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Henderson Software Labs "HSL" square mark, drawn with MUI so it tracks the
 * theme (black/white letters in light/dark, blue "S" throughout). Mirrors the
 * inline-SVG approach of `Logo` / `LogoMark`.
 */
export function HslMark({ size = 18 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: 0.5,
        border: (t) => `2px solid ${(t.vars ?? t).palette.primary.main}`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: size * 0.44,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: 'text.primary',
        }}
      >
        H
        <Box component="span" sx={{ color: 'primary.main' }}>
          S
        </Box>
        L
      </Box>
    </Box>
  );
}

/** "Powered by Henderson Software Labs" credit — mark + text, links to the HSL site. */
export function PoweredByHsl({
  size = 18,
  fontSize = '0.6875rem',
  gap = 0.75,
  sx,
}: {
  size?: number;
  fontSize?: string | number;
  gap?: number;
  sx?: SxProps<Theme>;
}) {
  return (
    <Link
      href="https://hendersonsoftwarelabs.com"
      target="_blank"
      rel="noopener noreferrer"
      underline="hover"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        color: 'text.secondary',
        ...sx,
      }}
    >
      <HslMark size={size} />
      <Box component="span" sx={{ fontSize, lineHeight: 1.3 }}>
        <Box component="span" sx={{ color: 'text.disabled' }}>
          Powered by{' '}
        </Box>
        <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Henderson Software Labs
        </Box>
      </Box>
    </Link>
  );
}
