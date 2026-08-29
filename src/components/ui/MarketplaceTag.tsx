import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import type { Marketplace } from '../../types';
import { MARKETPLACE_LABELS } from '../../lib/format';
import { MARKETPLACE_COLORS } from '../../theme';

interface MarketplaceTagProps {
  marketplace: Marketplace;
}

export function MarketplaceTag({ marketplace }: MarketplaceTagProps) {
  const color = MARKETPLACE_COLORS[marketplace];

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
          boxShadow: `0 0 0 3px ${alpha(color, 0.12)}`,
        }}
      />
      {MARKETPLACE_LABELS[marketplace]}
    </Box>
  );
}
