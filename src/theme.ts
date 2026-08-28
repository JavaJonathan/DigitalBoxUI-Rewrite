import { createTheme } from '@mui/material/styles';

const headingFont = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';
const bodyFont = '"Inter", "Segoe UI", system-ui, sans-serif';

/** Muted page-shell background used behind the authenticated app. */
export const SURFACE_SUBTLE = '#f0f2f5';

/** Dark brand surface for the login split-panel — keeps the old DigitalBox blue identity. */
export const SURFACE_DARK = '#060060';

export const BRAND_GRADIENT =
  'linear-gradient(90deg, rgba(69,136,242,1) 12%, rgba(7,140,252,1) 46%, rgba(6,0,96,1) 94%)';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#eff6ff',
      contrastText: '#ffffff',
    },
    success: { main: '#15803d' },
    error: { main: '#b91c1c' },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 },
    h2: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 },
    h3: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.015em' },
    h5: { fontFamily: headingFont, fontWeight: 800 },
    h6: { fontFamily: headingFont, fontWeight: 700 },
    overline: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '0.1em' },
    button: { fontFamily: headingFont, textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingLeft: 18,
          paddingRight: 18,
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset',
            WebkitTextFillColor: '#0f172a',
            caretColor: '#0f172a',
          },
        },
      },
    },
  },
});
