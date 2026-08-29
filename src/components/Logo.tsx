import Box from '@mui/material/Box';

/**
 * DigitalBox mark — an isometric box whose top face is split into a 2×2 pixel
 * grid (box + "digital"). Strokes use currentColor so the glyph adapts to
 * context; `LogoMark` sets it on the primary tile, matching the favicon.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.28)}px`,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.66}
        height={size * 0.66}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* lit "pixels" on the top face — the digital half of the mark */}
        <path
          d="M16 3.5 21.75 6.75 16 10 10.25 6.75Z M10.25 13.25 16 10 21.75 13.25 16 16.5Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="none"
        />
        {/* box outline + three inner edges */}
        <path d="M16 3.5 27.5 10v12L16 28.5 4.5 22V10L16 3.5Z" />
        <path d="M4.5 10 16 16.5l11.5-6.5M16 28.5v-12" />
        {/* top-face grid */}
        <path d="M10.25 6.75 21.75 13.25M21.75 6.75 10.25 13.25" strokeWidth="1.5" strokeOpacity="0.9" />
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
