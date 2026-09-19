import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import type { OrderStatus, ParseStatus } from '../../types';
import { PARSE_STATUS_LABELS, STATUS_LABELS } from '../../lib/format';

export type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

// Module scope: this used to be rebuilt on every render of every badge, i.e. once per table
// row per paint.
const TONES: Record<Tone, (t: Theme) => { fg: string; bg: string; dot: string }> = {
  neutral: (t) => ({
    fg: (t.vars ?? t).palette.text.secondary,
    bg: (t.vars ?? t).palette.surface.sunken,
    dot: (t.vars ?? t).palette.text.disabled,
  }),
  success: (t) => ({
    fg: (t.vars ?? t).palette.success.dark,
    bg: (t.vars ?? t).palette.success.light,
    dot: (t.vars ?? t).palette.success.main,
  }),
  danger: (t) => ({
    fg: (t.vars ?? t).palette.error.dark,
    bg: (t.vars ?? t).palette.error.light,
    dot: (t.vars ?? t).palette.error.main,
  }),
  warning: (t) => ({
    fg: (t.vars ?? t).palette.warning.dark,
    bg: (t.vars ?? t).palette.warning.light,
    dot: (t.vars ?? t).palette.warning.main,
  }),
  info: (t) => ({
    fg: (t.vars ?? t).palette.primary.dark,
    bg: (t.vars ?? t).palette.primary.light,
    dot: (t.vars ?? t).palette.primary.main,
  }),
};

/**
 * The one pill in the app: order status, parse status, inventory status and user role all
 * render through this, so they share a height, radius and type size.
 */
export function StatusBadge({
  tone,
  label,
  dot = true,
}: {
  tone: Tone;
  label: string;
  /** Role pills read as labels rather than live states, so they omit the leading dot. */
  dot?: boolean;
}) {
  return (
    <Box
      component="span"
      sx={(t) => {
        const c = TONES[tone](t);
        return {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.625,
          height: 22,
          px: 0.875,
          borderRadius: 'var(--db-radius-sm)',
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          color: c.fg,
          bgcolor: c.bg,
          whiteSpace: 'nowrap',
          ...(dot && {
            '&::before': {
              content: '""',
              width: 5,
              height: 5,
              borderRadius: '50%',
              bgcolor: c.dot,
            },
          }),
        };
      }}
    >
      {label}
    </Box>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone: Tone = status === 'Shipped' ? 'success' : status === 'Cancelled' ? 'danger' : 'info';
  return <StatusBadge tone={tone} label={STATUS_LABELS[status]} />;
}

export function ParseStatusBadge({ status }: { status: ParseStatus }) {
  if (status === 'Parsed') return null;
  const tone: Tone = status === 'Failed' ? 'danger' : 'warning';
  return <StatusBadge tone={tone} label={PARSE_STATUS_LABELS[status]} />;
}
