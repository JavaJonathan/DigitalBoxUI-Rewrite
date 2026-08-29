import { createTheme, alpha } from '@mui/material/styles';

/* ------------------------------------------------------------------ *
 * DigitalBox design system
 *
 * An operations tool, not a marketing site — the bar for "premium" here
 * is Linear / Vercel / Stripe dashboard: flat surfaces, 1px borders,
 * tight type, one confident accent, real dark mode. No gradients, no
 * glass, no hover-lift theatrics.
 * ------------------------------------------------------------------ */

/** Brand blue — the one DigitalBox identity colour, modernised. */
const brand = {
  50: '#eef4ff',
  100: '#dbe7ff',
  200: '#bcd0ff',
  300: '#8fb2ff',
  400: '#5b8bfa',
  500: '#2f6fed',
  600: '#1f57d6',
  700: '#1c46ad',
  800: '#1d3d89',
  900: '#1c376e',
};

export const MARKETPLACE_COLORS: Record<string, string> = {
  Amazon: '#ff9900',
  Ebay: '#e53238',
  Walmart: '#0071dc',
  Shopify: '#5e8e3e',
  Unknown: '#9aa0aa',
};

const FONT_SANS =
  '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const FONT_MONO = '"Geist Mono", "SFMono-Regular", ui-monospace, "JetBrains Mono", monospace';

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        primary: {
          main: brand[500],
          dark: brand[600],
          light: brand[100],
          contrastText: '#ffffff',
        },
        success: { main: '#1a8f4c', light: '#e6f6ec', dark: '#137239', contrastText: '#ffffff' },
        error: { main: '#dc2b2b', light: '#fdecec', dark: '#b91c1c', contrastText: '#ffffff' },
        warning: { main: '#c77700', light: '#fdf3e3', dark: '#9a5b00', contrastText: '#ffffff' },
        info: { main: brand[500], light: brand[50], dark: brand[600], contrastText: '#ffffff' },
        text: {
          primary: '#17171a',
          secondary: '#5f606a',
          disabled: '#a3a4ad',
        },
        background: {
          default: '#fbfbfc',
          paper: '#ffffff',
        },
        divider: '#e8e8ed',
        action: {
          hover: alpha('#17171a', 0.04),
          selected: alpha(brand[500], 0.08),
          focus: alpha(brand[500], 0.12),
        },
        // Custom surface tokens (accessed via (theme.vars ?? theme).palette.surface.*)
        surface: {
          canvas: '#fbfbfc',
          panel: '#ffffff',
          sunken: '#f4f4f6',
          inset: '#f7f7f9',
          border: '#e8e8ed',
          borderStrong: '#d6d6dd',
          hover: alpha('#17171a', 0.035),
        },
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: '#4f8bff',
          dark: '#3d78ea',
          light: alpha('#4f8bff', 0.16),
          contrastText: '#0a0a0b',
        },
        success: {
          main: '#3ecf8e',
          light: alpha('#3ecf8e', 0.16),
          dark: '#2fae76',
          contrastText: '#0a0a0b',
        },
        error: {
          main: '#ff6369',
          light: alpha('#ff6369', 0.16),
          dark: '#e5484d',
          contrastText: '#0a0a0b',
        },
        warning: {
          main: '#f5b545',
          light: alpha('#f5b545', 0.16),
          dark: '#d99530',
          contrastText: '#0a0a0b',
        },
        info: {
          main: '#4f8bff',
          light: alpha('#4f8bff', 0.16),
          dark: '#3d78ea',
          contrastText: '#0a0a0b',
        },
        text: {
          primary: '#f2f2f3',
          secondary: '#9d9da6',
          disabled: '#5c5c64',
        },
        background: {
          default: '#0a0a0b',
          paper: '#141417',
        },
        divider: '#26262b',
        action: {
          hover: alpha('#ffffff', 0.045),
          selected: alpha('#4f8bff', 0.16),
          focus: alpha('#4f8bff', 0.2),
        },
        surface: {
          canvas: '#0a0a0b',
          panel: '#141417',
          sunken: '#1b1b1f',
          inset: '#0f0f11',
          border: '#26262b',
          borderStrong: '#37373e',
          hover: alpha('#ffffff', 0.04),
        },
      },
    },
  },
  shape: { borderRadius: 8 },
  spacing: 4,
  typography: {
    fontFamily: FONT_SANS,
    fontSize: 14,
    fontWeightRegular: 450,
    fontWeightMedium: 550,
    fontWeightBold: 650,
    h1: { fontSize: '1.875rem', fontWeight: 680, letterSpacing: '-0.021em', lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 660, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 640, letterSpacing: '-0.018em', lineHeight: 1.3 },
    h4: { fontSize: '1.0625rem', fontWeight: 640, letterSpacing: '-0.014em', lineHeight: 1.35 },
    h5: { fontSize: '0.9375rem', fontWeight: 620, letterSpacing: '-0.01em', lineHeight: 1.4 },
    h6: { fontSize: '0.8125rem', fontWeight: 620, letterSpacing: '0', lineHeight: 1.4 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 550, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.02em' },
    body1: { fontSize: '0.875rem', fontWeight: 450, lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', fontWeight: 450, lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', fontWeight: 450, lineHeight: 1.45 },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 620,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
    button: { fontSize: '0.8125rem', fontWeight: 560, letterSpacing: '0', textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        ':root': {
          colorScheme: 'light dark',
          '--db-mono': FONT_MONO,
          '--db-shadow-sm': '0 1px 2px rgba(16,17,26,0.04), 0 1px 3px rgba(16,17,26,0.05)',
          '--db-shadow-md':
            '0 4px 12px -2px rgba(16,17,26,0.10), 0 2px 6px -2px rgba(16,17,26,0.06)',
          '--db-shadow-lg':
            '0 24px 56px -12px rgba(16,17,26,0.24), 0 8px 20px -8px rgba(16,17,26,0.14)',
        },
        '.dark': {
          '--db-shadow-sm': '0 1px 2px rgba(0,0,0,0.4)',
          '--db-shadow-md': '0 6px 20px -4px rgba(0,0,0,0.55), 0 2px 6px -2px rgba(0,0,0,0.4)',
          '--db-shadow-lg': '0 32px 64px -16px rgba(0,0,0,0.7), 0 12px 28px -8px rgba(0,0,0,0.5)',
        },
        html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        body: {
          backgroundColor: (t.vars ?? t).palette.surface.canvas,
          color: (t.vars ?? t).palette.text.primary,
          fontFeatureSettings: '"cv05", "cv08", "cv11", "ss01"',
          textRendering: 'optimizeLegibility',
        },
        '*, *::before, *::after': { boxSizing: 'border-box' },
        '::selection': { backgroundColor: alpha(brand[500], 0.22) },
        // quiet, thin scrollbars
        '*': {
          scrollbarColor: `${(t.vars ?? t).palette.surface.borderStrong} transparent`,
          scrollbarWidth: 'thin',
        },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'transparent',
          borderRadius: 8,
          border: '3px solid transparent',
          backgroundClip: 'content-box',
        },
        ':hover::-webkit-scrollbar-thumb, *:hover > *::-webkit-scrollbar-thumb': {
          backgroundColor: (t.vars ?? t).palette.surface.borderStrong,
        },
        // consistent keyboard focus everywhere
        ':focus-visible': {
          outline: `2px solid ${(t.vars ?? t).palette.primary.main}`,
          outlineOffset: 2,
          borderRadius: 4,
        },
      }),
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundImage: 'none',
          '--Paper-overlay': 'none',
          backgroundColor: (t.vars ?? t).palette.surface.panel,
        }),
        outlined: ({ theme: t }) => ({
          border: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          borderRadius: 12,
        }),
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 7,
          textTransform: 'none',
          transition:
            'background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease',
        },
        sizeSmall: { height: 28, paddingInline: 10, fontSize: '0.8125rem' },
        sizeMedium: { height: 34, paddingInline: 14 },
        sizeLarge: { height: 42, paddingInline: 18, fontSize: '0.875rem' },
        contained: ({ theme: t }) => ({
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none', backgroundColor: (t.vars ?? t).palette.primary.dark },
          '&:active': { transform: 'translateY(0.5px)' },
        }),
        outlined: ({ theme: t }) => ({
          borderColor: (t.vars ?? t).palette.surface.borderStrong,
          color: (t.vars ?? t).palette.text.primary,
          backgroundColor: (t.vars ?? t).palette.surface.panel,
          '&:hover': {
            backgroundColor: (t.vars ?? t).palette.surface.hover,
          },
        }),
        text: ({ theme: t }) => ({
          color: (t.vars ?? t).palette.text.secondary,
          '&:hover': {
            backgroundColor: (t.vars ?? t).palette.surface.hover,
            color: (t.vars ?? t).palette.text.primary,
          },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 7,
          color: (t.vars ?? t).palette.text.secondary,
          transition: 'background-color 120ms ease, color 120ms ease',
          '&:hover': {
            backgroundColor: (t.vars ?? t).palette.surface.hover,
            color: (t.vars ?? t).palette.text.primary,
          },
        }),
        sizeSmall: { padding: 5 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 550,
          fontSize: '0.75rem',
          height: 22,
        },
        sizeSmall: { height: 20, fontSize: '0.6875rem' },
        label: { paddingInline: 7 },
        outlined: ({ theme: t }) => ({ borderColor: (t.vars ?? t).palette.surface.border }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme: t }) => ({ borderColor: (t.vars ?? t).palette.surface.border }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 7,
          backgroundColor: (t.vars ?? t).palette.surface.panel,
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t.vars ?? t).palette.surface.borderStrong,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t.vars ?? t).palette.text.disabled,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t.vars ?? t).palette.primary.main,
            borderWidth: 1,
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${alpha(brand[500], 0.16)}`,
          },
        }),
        input: {
          fontSize: '0.875rem',
          paddingBlock: 8,
          '&::placeholder': { opacity: 1 },
          '&:-webkit-autofill': {
            transition: 'background-color 9999s ease-out',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: ({ theme: t }) => ({
          '&::placeholder': { color: (t.vars ?? t).palette.text.disabled, opacity: 1 },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
    MuiCheckbox: {
      defaultProps: { size: 'small', disableRipple: true },
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 4,
          color: (t.vars ?? t).palette.surface.borderStrong,
          padding: 5,
          '&:hover': { backgroundColor: (t.vars ?? t).palette.surface.hover },
          '&.Mui-checked': { color: (t.vars ?? t).palette.primary.main },
        }),
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: 'separate', borderSpacing: 0 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderBottom: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          padding: '8px 16px',
          fontSize: '0.8125rem',
          lineHeight: 1.45,
          color: (t.vars ?? t).palette.text.primary,
        }),
        head: ({ theme: t }) => ({
          backgroundColor: (t.vars ?? t).palette.surface.panel,
          color: (t.vars ?? t).palette.text.secondary,
          fontSize: '0.6875rem',
          fontWeight: 620,
          lineHeight: 1.3,
          letterSpacing: '0.045em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          borderBottom: `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
          paddingBlock: 9,
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          transition: 'background-color 100ms ease',
          '&:last-of-type td': { borderBottom: 'none' },
          '&.MuiTableRow-hover:hover': { backgroundColor: (t.vars ?? t).palette.surface.hover },
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: alpha(brand[500], 0.07),
          },
        }),
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
          textTransform: 'inherit',
          color: 'inherit',
          '&:hover': { color: (t.vars ?? t).palette.text.primary },
          '&.Mui-active': { color: (t.vars ?? t).palette.text.primary },
        }),
        icon: { fontSize: 15, opacity: 0.6 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          minHeight: 40,
          borderBottom: `1px solid ${(t.vars ?? t).palette.surface.border}`,
        }),
        indicator: ({ theme: t }) => ({
          height: 2,
          borderRadius: 2,
          backgroundColor: (t.vars ?? t).palette.primary.main,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          minHeight: 40,
          padding: '8px 4px',
          marginRight: 20,
          minWidth: 0,
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 550,
          color: (t.vars ?? t).palette.text.secondary,
          '&.Mui-selected': { color: (t.vars ?? t).palette.text.primary },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 14,
          border: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          boxShadow: 'var(--db-shadow-lg)',
          backgroundImage: 'none',
        }),
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0a0a0c', 0.5),
          backdropFilter: 'blur(2px)',
        },
        invisible: { backgroundColor: 'transparent', backdropFilter: 'none' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '0.9375rem', fontWeight: 620, padding: '18px 20px 4px' },
      },
    },
    MuiDialogContent: { styleOverrides: { root: { padding: '12px 20px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '12px 20px 16px', gap: 8 } } },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 10,
          border: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          boxShadow: 'var(--db-shadow-md)',
          marginTop: 4,
        }),
        list: { padding: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 6,
          fontSize: '0.8125rem',
          minHeight: 34,
          '&:hover': { backgroundColor: (t.vars ?? t).palette.surface.hover },
          '&.Mui-selected': { backgroundColor: alpha(brand[500], 0.1) },
          '&.Mui-selected:hover': { backgroundColor: alpha(brand[500], 0.14) },
        }),
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRadius: 10,
          border: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          boxShadow: 'var(--db-shadow-md)',
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#26262c',
          color: '#f4f4f5',
          fontSize: '0.6875rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '5px 8px',
          boxShadow: 'var(--db-shadow-md)',
        },
        arrow: { color: '#26262c' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 9,
          border: `1px solid ${(t.vars ?? t).palette.surface.border}`,
          fontSize: '0.8125rem',
          alignItems: 'center',
          boxShadow: 'var(--db-shadow-md)',
          backgroundColor: (t.vars ?? t).palette.surface.panel,
          color: (t.vars ?? t).palette.text.primary,
        }),
        icon: { opacity: 1, padding: 0 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 999,
          height: 4,
          backgroundColor: (t.vars ?? t).palette.surface.sunken,
        }),
        bar: { borderRadius: 999 },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: ({ theme: t }) => ({
          color: (t.vars ?? t).palette.primary.main,
          fontWeight: 500,
          textUnderlineOffset: 2,
        }),
      },
    },
    MuiPagination: {
      styleOverrides: {
        ul: { gap: 2 },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: 7,
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: (t.vars ?? t).palette.text.secondary,
          '&.Mui-selected': {
            backgroundColor: (t.vars ?? t).palette.surface.sunken,
            color: (t.vars ?? t).palette.text.primary,
          },
        }),
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundColor: (t.vars ?? t).palette.surface.sunken,
          borderRadius: 6,
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: '0.875rem' },
      },
    },
  },
});

/* Augment the palette so (theme.vars ?? theme).palette.surface.* type-checks. */
declare module '@mui/material/styles' {
  interface PaletteOptions {
    surface?: {
      canvas: string;
      panel: string;
      sunken: string;
      inset: string;
      border: string;
      borderStrong: string;
      hover: string;
    };
  }
  interface Palette {
    surface: {
      canvas: string;
      panel: string;
      sunken: string;
      inset: string;
      border: string;
      borderStrong: string;
      hover: string;
    };
  }
}
