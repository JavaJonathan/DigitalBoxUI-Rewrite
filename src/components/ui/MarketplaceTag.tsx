import Box from '@mui/material/Box';
import type { Marketplace } from '../../types';
import { MARKETPLACE_LABELS } from '../../lib/format';
import { MARKETPLACE_COLORS } from '../../theme';

interface MarketplaceTagProps {
  marketplace: Marketplace;
  /** dot only, no label */
  compact?: boolean;
}

export function MarketplaceTag({ marketplace, compact = false }: MarketplaceTagProps) {
  const color = MARKETPLACE_COLORS[marketplace] ?? MARKETPLACE_COLORS.Unknown;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: '0.8125rem',
        color: 'text.primary',
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: color,
          flexShrink: 0,
          boxShadow: `0 0 0 3px ${color}1f`,
        }}
      />
      {!compact && MARKETPLACE_LABELS[marketplace]}
    </Box>
  );
}
