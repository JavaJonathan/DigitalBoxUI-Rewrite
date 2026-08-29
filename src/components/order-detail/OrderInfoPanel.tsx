import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { Mono } from '../ui/Mono';
import { MarketplaceTag } from '../ui/MarketplaceTag';
import { formatDate, pluralize } from '../../lib/format';
import type { OrderDetail } from '../../types';

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75, alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', width: 96, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: '0.8125rem', minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

/** Read-only view of an order's parsed fields + line items. */
export function OrderInfoPanel({ order }: { order: OrderDetail }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <FieldRow label="Marketplace">
        <MarketplaceTag marketplace={order.marketplace} />
      </FieldRow>
      <FieldRow label="Ship date">
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: order.shipDate ? 'text.primary' : 'text.disabled',
          }}
        >
          {formatDate(order.shipDate)}
        </Typography>
      </FieldRow>
      {order.actionedBy && <FieldRow label="Operator">{order.actionedBy}</FieldRow>}

      <Divider sx={{ my: 1.5 }} />
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
        Line items · {pluralize(order.totalQuantity, 'unit')}
      </Typography>
      <Stack spacing={1}>
        {order.lineItems.map((li) => (
          <Box key={li.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Box
              sx={{
                minWidth: 26,
                height: 20,
                px: 0.5,
                mt: 0.125,
                borderRadius: 1,
                bgcolor: 'surface.sunken',
                color: 'text.secondary',
                fontSize: '0.6875rem',
                fontWeight: 650,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ×{li.quantity}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>{li.title}</Typography>
              {li.sku && (
                <Mono muted sx={{ fontSize: '0.6875rem' }}>
                  {li.sku}
                </Mono>
              )}
            </Box>
          </Box>
        ))}
        {order.lineItems.length === 0 && (
          <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled' }}>
            Nothing was parsed. Use Edit to enter the items manually.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
