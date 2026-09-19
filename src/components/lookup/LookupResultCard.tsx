import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Mono } from '../ui/Mono';
import { MarketplaceTag } from '../ui/MarketplaceTag';
import { OrderStatusBadge, StatusBadge, type Tone } from '../ui/StatusBadge';
import { formatDate } from '../../lib/format';
import type { InventoryLineStatus, LookupLineItem, LookupResult } from '../../types';

const INVENTORY: Record<InventoryLineStatus, { tone: Tone; label: string }> = {
  InStock: { tone: 'success', label: 'In stock' },
  PreOrdered: { tone: 'warning', label: 'Pre-ordered' },
  Unknown: { tone: 'neutral', label: 'Unknown' },
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ fontSize: '0.875rem' }}>{children}</Box>
    </Box>
  );
}

function ItemsTable({ items, showStatus }: { items: LookupLineItem[]; showStatus: boolean }) {
  if (items.length === 0) return null;
  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow>
          <TableCell>Item</TableCell>
          <TableCell align="right" sx={{ width: 64 }}>
            Qty
          </TableCell>
          {showStatus && (
            <TableCell align="right" sx={{ width: 120 }}>
              Status
            </TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item, i) => (
          <TableRow key={`${item.sku ?? item.title}-${i}`}>
            <TableCell>
              <Typography sx={{ fontSize: '0.8125rem' }}>{item.title}</Typography>
              {item.sku && (
                <Mono muted sx={{ fontSize: '0.6875rem' }}>
                  {item.sku}
                </Mono>
              )}
            </TableCell>
            <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {item.quantity}
            </TableCell>
            {showStatus && (
              <TableCell align="right">
                {item.inventoryStatus && <StatusBadge {...INVENTORY[item.inventoryStatus]} />}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function addressLines(shipTo: NonNullable<LookupResult['shipStation']>['shipTo']): string[] {
  if (!shipTo) return [];
  const cityLine = [shipTo.city, shipTo.state].filter(Boolean).join(', ');
  const lastLine = [cityLine, shipTo.postalCode].filter(Boolean).join(' ');
  return [shipTo.name, shipTo.street1, shipTo.street2, lastLine, shipTo.country].filter(
    (l): l is string => Boolean(l && l.trim()),
  );
}

export function LookupResultCard({ result }: { result: LookupResult }) {
  const { digitalBox: db, shipStation: ss } = result;
  const dbAwaiting = db?.status === 'Open';
  const ssAwaiting = ss ? ss.items.some((i) => i.inventoryStatus !== null) : false;

  return (
    <Stack spacing={2}>
      {db && (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>In DigitalBox</Typography>
              <OrderStatusBadge status={db.status} />
            </Box>
            <Link
              component={RouterLink}
              to={`/orders/${db.orderId}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.8125rem',
                fontWeight: 600,
              }}
            >
              View order
              <NorthEastIcon fontSize="inherit" />
            </Link>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Field label="Status">{db.summary}</Field>
            <Field label="Marketplace">
              <MarketplaceTag marketplace={db.marketplace} />
            </Field>
            <Field label="Ship date">{formatDate(db.shipDate)}</Field>
            <Field label="Priority">{db.isPriority ? 'Yes' : 'No'}</Field>
          </Box>

          {db.notes && (
            <Box sx={{ mt: 2 }}>
              <Field label="Note">{db.notes}</Field>
            </Box>
          )}

          {db.duplicateCount > 1 && (
            <Typography sx={{ mt: 1.5, fontSize: '0.75rem', color: 'warning.dark' }}>
              {db.duplicateCount} orders in DigitalBox share this number; showing the most recent.
            </Typography>
          )}

          <ItemsTable items={db.lineItems} showStatus={dbAwaiting} />
        </Paper>
      )}

      {ss && (
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, mb: 2 }}>
            {result.source === 'ShipStation' ? 'From ShipStation' : 'ShipStation (live)'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <Field label="Order status">{ss.orderStatus.replace(/_/g, ' ') || '—'}</Field>
            <Field label="Order date">{formatDate(ss.orderDate)}</Field>
            <Field label="Tracking">
              {ss.trackingNumber ? <Mono>{ss.trackingNumber}</Mono> : '—'}
            </Field>
            <Field label="Carrier">{ss.carrier || '—'}</Field>
          </Box>

          {ss.shipTo && addressLines(ss.shipTo).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Field label="Ship to">
                {addressLines(ss.shipTo).map((line, i) => (
                  <Typography key={i}>{line}</Typography>
                ))}
              </Field>
            </Box>
          )}

          <ItemsTable items={ss.items} showStatus={ssAwaiting} />
        </Paper>
      )}

      {result.shipStationError ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
          {result.shipStationError}
        </Typography>
      ) : (
        !result.shipStationConfigured && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
            ShipStation isn’t configured; showing DigitalBox data only.
          </Typography>
        )
      )}
    </Stack>
  );
}
