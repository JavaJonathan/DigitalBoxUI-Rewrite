import Box from '@mui/material/Box';
import type { OrderStatus, ParseStatus } from '../../types';
import { PARSE_STATUS_LABELS, STATUS_LABELS } from '../../lib/format';

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

const TONE_SX = (tone: Tone) => (t: import('@mui/material/styles').Theme) => {
  const map: Record<Tone, { fg: string; bg: string; dot: string }> = {
    neutral: {
      fg: (t.vars ?? t).palette.text.secondary,
      bg: (t.vars ?? t).palette.surface.sunken,
      dot: (t.vars ?? t).palette.text.disabled,
    },
    success: {
      fg: (t.vars ?? t).palette.success.dark,
      bg: (t.vars ?? t).palette.success.light,
      dot: (t.vars ?? t).palette.success.main,
    },
    danger: {
      fg: (t.vars ?? t).palette.error.dark,
      bg: (t.vars ?? t).palette.error.light,
      dot: (t.vars ?? t).palette.error.main,
    },
    warning: {
      fg: (t.vars ?? t).palette.warning.dark,
      bg: (t.vars ?? t).palette.warning.light,
      dot: (t.vars ?? t).palette.warning.main,
    },
    info: {
      fg: (t.vars ?? t).palette.primary.dark,
      bg: (t.vars ?? t).palette.primary.light,
      dot: (t.vars ?? t).palette.primary.main,
    },
  };
  const c = map[tone];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.625,
    height: 22,
    px: 0.875,
    borderRadius: 1.5,
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: c.fg,
    bgcolor: c.bg,
    whiteSpace: 'nowrap',
    '&::before': {
      content: '""',
      width: 5,
      height: 5,
      borderRadius: '50%',
      bgcolor: c.dot,
    },
  };
};

function Badge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <Box component="span" sx={TONE_SX(tone)}>
      {label}
    </Box>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone: Tone = status === 'Shipped' ? 'success' : status === 'Cancelled' ? 'danger' : 'info';
  return <Badge tone={tone} label={STATUS_LABELS[status]} />;
}

export function ParseStatusBadge({ status }: { status: ParseStatus }) {
  if (status === 'Parsed') return null;
  const tone: Tone = status === 'Failed' ? 'danger' : 'warning';
  return <Badge tone={tone} label={PARSE_STATUS_LABELS[status]} />;
}
