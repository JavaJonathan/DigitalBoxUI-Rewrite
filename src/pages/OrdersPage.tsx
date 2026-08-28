import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { AppShell } from '../components/AppShell';
import { QueueToolbar } from '../components/QueueToolbar';
import { OrdersTable } from '../components/OrdersTable';
import { UploadDialog } from '../components/UploadDialog';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { SelectionBar } from '../components/SelectionBar';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useOrders } from '../hooks/useOrders';
import { cancelOrders, shipOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ToastProvider';
import type { Marketplace } from '../types';

const PAGE_SIZE = 50;

export function OrdersPage() {
  const { notify } = useToast();
  const [q, setQ] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace | ''>('');
  const [sort, setSort] = useState<'shipDate' | 'title'>('shipDate');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [action, setAction] = useState<'ship' | 'cancel' | null>(null);

  const query = useMemo(
    () => ({ status: 'Open' as const, q, marketplace, sort, page, pageSize: PAGE_SIZE }),
    [q, marketplace, sort, page],
  );
  const { data, loading, error, refresh } = useOrders(query);

  const orders = data?.items ?? [];
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = q.length > 0 || marketplace !== '';

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(orders.map((o) => o.id)) : new Set());

  const runAction = async (actionedBy: string) => {
    const ids = [...selected];
    try {
      const result =
        action === 'ship' ? await shipOrders(ids, actionedBy) : await cancelOrders(ids, actionedBy);
      notify(result.message, 'success');
      setSelected(new Set());
      setAction(null);
      refresh();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Action failed.'), 'error');
    }
  };

  return (
    <AppShell
      title="Queue"
      titleMeta={
        <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
          {data?.total ?? 0} open
        </Typography>
      }
      actions={
        <>
          <Tooltip title="Refresh" arrow>
            <IconButton size="small" onClick={refresh} aria-label="Refresh">
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<UploadFileOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setUploadOpen(true)}
          >
            Upload slips
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <QueueToolbar
          q={q}
          marketplace={marketplace}
          onChange={(next) => {
            setQ(next.q);
            setMarketplace(next.marketplace);
            setPage(1);
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`, borderRadius: 3, bgcolor: 'surface.panel' }}>
            <TableSkeleton rows={10} columns={6} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`, borderRadius: 3, bgcolor: 'surface.panel' }}>
            {filtered ? (
              <EmptyState
                icon={<Inventory2OutlinedIcon />}
                title="No matching orders"
                description="Try a different search term or marketplace filter."
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setQ('');
                      setMarketplace('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<UploadFileOutlinedIcon />}
                title="The queue is clear"
                description="Upload packing-slip PDFs and DigitalBox will parse them into orders ready to ship."
                action={
                  <Button variant="contained" size="small" onClick={() => setUploadOpen(true)}>
                    Upload packing slips
                  </Button>
                }
              />
            )}
          </Box>
        ) : (
          <OrdersTable
            orders={orders}
            status="Open"
            selectable
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            sort={sort}
            onSortChange={setSort}
          />
        )}

        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.5 }}>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} size="small" />
          </Box>
        )}
      </Stack>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onShip={() => setAction('ship')}
        onCancel={() => setAction('cancel')}
      />

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refresh} />

      <ConfirmActionDialog
        open={action !== null}
        intent={action ?? 'ship'}
        count={selected.size}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      />
    </AppShell>
  );
}
