import { useEffect, useState, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/ui/EmptyState';
import { RelativeTime } from '../components/ui/RelativeTime';
import { LookupResultCard } from '../components/lookup/LookupResultCard';
import { InventoryUploadDialog } from '../components/lookup/InventoryUploadDialog';
import { getInventoryStatus, lookupOrder } from '../api/lookup';
import { getApiErrorMessage } from '../api/client';
import { pluralize } from '../lib/format';
import type { InventoryKind, InventorySnapshot, InventoryStatus, LookupResult } from '../types';

const panelSx = {
  border: (t: import('@mui/material/styles').Theme) =>
    `1px solid ${(t.vars ?? t).palette.surface.border}`,
  borderRadius: 3,
  bgcolor: 'surface.panel',
} as const;

function InventoryRow({
  label,
  snapshot,
  onReplace,
}: {
  label: string;
  snapshot: InventorySnapshot | null;
  onReplace: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2.5,
        py: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
          {snapshot ? (
            <>
              {pluralize(snapshot.rowCount, 'SKU')} · updated{' '}
              <RelativeTime value={snapshot.uploadedAt} />
              {snapshot.uploadedBy ? ` by ${snapshot.uploadedBy}` : ''}
            </>
          ) : (
            'Not uploaded yet'
          )}
        </Typography>
      </Box>
      <Button variant="outlined" size="small" onClick={onReplace}>
        {snapshot ? 'Replace' : 'Upload'}
      </Button>
    </Box>
  );
}

export function LookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [uploadKind, setUploadKind] = useState<InventoryKind | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInventoryStatus()
      .then((status) => {
        if (!cancelled) setInventory(status);
      })
      .catch(() => {
        /* non-critical; the search still works without the panel */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await lookupOrder(trimmed));
    } catch (err) {
      setError(getApiErrorMessage(err, 'The lookup failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Lookup">
      <Stack spacing={3} sx={{ maxWidth: 900 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 640 }}>
          Check where an order stands: its status in DigitalBox, whether its items are in stock or
          on order, and live tracking and shipping details from ShipStation.
        </Typography>

        <Box component="form" onSubmit={search} sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Order number, e.g. 114-4065844-2591402"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ fontSize: 18, mr: 1, color: 'text.disabled' }} />,
              },
            }}
          />
          <Button type="submit" variant="contained" disabled={loading || !orderNumber.trim()}>
            Search
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && result && !result.found && (
          <Box sx={panelSx}>
            <EmptyState
              icon={<ManageSearchOutlinedIcon />}
              title="No order found"
              description={`Nothing in DigitalBox${
                result.shipStationConfigured ? ' or ShipStation' : ''
              } matches “${result.orderNumber}”.`}
            />
          </Box>
        )}

        {!loading && result?.found && <LookupResultCard result={result} />}

        <Box sx={panelSx}>
          <Typography
            sx={{
              px: 2.5,
              py: 1.5,
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              color: 'text.disabled',
              borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            }}
          >
            Inventory data
          </Typography>
          <InventoryRow
            label="In stock"
            snapshot={inventory?.inStock ?? null}
            onReplace={() => setUploadKind('inStock')}
          />
          <Box sx={{ borderTop: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}` }} />
          <InventoryRow
            label="Purchase orders"
            snapshot={inventory?.purchaseOrders ?? null}
            onReplace={() => setUploadKind('purchaseOrders')}
          />
        </Box>
      </Stack>

      {uploadKind && (
        <InventoryUploadDialog
          kind={uploadKind}
          onClose={() => setUploadKind(null)}
          onUploaded={(status) => {
            setInventory(status);
            setUploadKind(null);
          }}
        />
      )}
    </AppShell>
  );
}
