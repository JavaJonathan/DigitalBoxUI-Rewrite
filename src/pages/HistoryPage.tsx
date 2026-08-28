import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { AppShell } from '../components/AppShell';
import { QueueToolbar } from '../components/QueueToolbar';
import { OrdersTable } from '../components/OrdersTable';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/TableSkeleton';
import { useOrders } from '../hooks/useOrders';
import type { OrderStatus } from '../types';

const PAGE_SIZE = 50;

export function HistoryPage() {
  const [tab, setTab] = useState<Extract<OrderStatus, 'Shipped' | 'Cancelled'>>('Shipped');
  const [q, setQ] = useState('');

  const query = useMemo(
    () => ({ status: tab, q, sort: 'shipDate' as const, page: 1, pageSize: PAGE_SIZE }),
    [tab, q],
  );
  const { data, loading, error } = useOrders(query);
  const orders = data?.items ?? [];

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
          showMarketplace={false}
          onChange={(next) => setQ(next.q)}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`, borderRadius: 3, bgcolor: 'surface.panel' }}>
            <TableSkeleton rows={8} columns={7} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`, borderRadius: 3, bgcolor: 'surface.panel' }}>
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
          <OrdersTable orders={orders} status={tab} />
        )}
      </Stack>
    </AppShell>
  );
}
