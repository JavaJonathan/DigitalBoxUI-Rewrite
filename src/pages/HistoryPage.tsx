import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { AppShell } from '../components/AppShell';
import { QueueToolbar } from '../components/QueueToolbar';
import { OrdersTable } from '../components/OrdersTable';
import { SelectionBar } from '../components/SelectionBar';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useOrders } from '../hooks/useOrders';
import { undoOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { PAGE_SIZE } from '../lib/constants';
import { toggleInSet } from '../lib/collections';
import type { OrderStatus } from '../types';

export function HistoryPage() {
  const { notify } = useToast();
  const [tab, setTab] = useState<Extract<OrderStatus, 'Shipped' | 'Cancelled'>>('Shipped');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopenIds, setReopenIds] = useState<string[]>([]);

  const query = useMemo(
    () => ({ status: tab, q, sort: 'shipDate' as const, page: 1, pageSize: PAGE_SIZE }),
    [tab, q],
  );
  const { data, loading, error, refresh } = useOrders(query);
  const orders = data?.items ?? [];

  useEffect(() => setSelectedIds(new Set()), [tab, q]);

  const toggle = (id: string) => setSelectedIds((prev) => toggleInSet(prev, id));
  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(orders.map((o) => o.id)) : new Set());

  const runReopen = async (actionedBy: string) => {
    try {
      const result = await undoOrders(reopenIds, actionedBy);
      notify(result.message, 'success');
      setSelectedIds(new Set());
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not reopen the orders.'), 'error');
    }
  };

  return (
    <AppShell title="History">
      <Stack spacing={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Shipped" value="Shipped" />
          <Tab label="Cancelled" value="Cancelled" />
        </Tabs>

        <QueueToolbar
          q={q}
          marketplace=""
          priority={false}
          showMarketplace={false}
          onChange={(next) => setQ(next.q)}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box
            sx={{
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              borderRadius: 3,
              bgcolor: 'surface.panel',
            }}
          >
            <TableSkeleton rows={8} columns={7} />
          </Box>
        ) : orders.length === 0 ? (
          <Box
            sx={{
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              borderRadius: 3,
              bgcolor: 'surface.panel',
            }}
          >
            <EmptyState
              icon={<HistoryOutlinedIcon />}
              title={`No ${tab.toLowerCase()} orders`}
              description={
                q
                  ? 'Nothing matches that search.'
                  : `Orders you ${tab === 'Shipped' ? 'ship' : 'cancel'} will appear here.`
              }
            />
          </Box>
        ) : (
          <OrdersTable
            orders={orders}
            status={tab}
            selectable
            selectedIds={selectedIds}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onReopenRow={(order) => {
              setReopenIds([order.id]);
              setConfirmOpen(true);
            }}
          />
        )}
      </Stack>

      <SelectionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
        <Button
          size="large"
          variant="contained"
          startIcon={<ReplayRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => {
            setReopenIds([...selectedIds]);
            setConfirmOpen(true);
          }}
        >
          Reopen
        </Button>
      </SelectionBar>

      <ConfirmActionDialog
        open={confirmOpen}
        intent="reopen"
        count={reopenIds.length}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runReopen}
      />
    </AppShell>
  );
}
