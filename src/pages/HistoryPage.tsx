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
import type { OrderStatus } from '../types';

const PAGE_SIZE = 50;

export function HistoryPage() {
  const { notify } = useToast();
  const [tab, setTab] = useState<Extract<OrderStatus, 'Shipped' | 'Cancelled'>>('Shipped');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [undoIds, setUndoIds] = useState<string[]>([]);

  const query = useMemo(
    () => ({ status: tab, q, sort: 'shipDate' as const, page: 1, pageSize: PAGE_SIZE }),
    [tab, q],
  );
  const { data, loading, error, refresh } = useOrders(query);
  const orders = data?.items ?? [];

  useEffect(() => setSelected(new Set()), [tab, q]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(orders.map((o) => o.id)) : new Set());

  const runUndo = async (actionedBy: string) => {
    try {
      const result = await undoOrders(undoIds, actionedBy);
      notify(result.message, 'success');
      setSelected(new Set());
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
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onUndoRow={(order) => {
              setUndoIds([order.id]);
              setConfirmOpen(true);
            }}
          />
        )}
      </Stack>

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button
          size="large"
          variant="contained"
          startIcon={<ReplayRoundedIcon sx={{ fontSize: 18 }} />}
          onClick={() => {
            setUndoIds([...selected]);
            setConfirmOpen(true);
          }}
        >
          Reopen
        </Button>
      </SelectionBar>

      <ConfirmActionDialog
        open={confirmOpen}
        intent="undo"
        count={undoIds.length}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runUndo}
      />
    </AppShell>
  );
}
