import Box from '@mui/material/Box';

/** Minimal isometric-box monogram. Uses currentColor so it adapts to context. */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size / 4,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M3 7l9 4.5L21 7M12 21.5v-10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <LogoMark size={size} />
      <Box
        component="span"
        sx={{
          fontSize: '0.9375rem',
          fontWeight: 660,
          letterSpacing: '-0.02em',
          color: 'text.primary',
        }}
      >
        DigitalBox
      </Box>
    </Box>
  );
}
