import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { AppLayout } from '../components/AppLayout';
import { FilterBar } from '../components/FilterBar';
import { OrdersTable } from '../components/OrdersTable';
import { useOrders } from '../hooks/useOrders';
import type { OrderStatus } from '../types';

const PAGE_SIZE = 50;

export function HistoryPage() {
  const [tab, setTab] = useState<OrderStatus>('Shipped');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({ status: tab, q, sort: 'shipDate' as const, page, pageSize: PAGE_SIZE }),
    [tab, q, page],
  );
  const { data, loading, error } = useOrders(query);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AppLayout>
      <Stack spacing={2}>
        <Typography variant="h5">Order history</Typography>

        <Tabs
          value={tab}
          onChange={(_, value) => {
            setTab(value);
            setPage(1);
          }}
        >
          <Tab label="Shipped" value="Shipped" />
          <Tab label="Cancelled" value="Cancelled" />
        </Tabs>

        <FilterBar
          q={q}
          marketplace=""
          showMarketplace={false}
          onChange={(next) => {
            setQ(next.q);
            setPage(1);
          }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <OrdersTable
            orders={data?.items ?? []}
            status={tab}
            emptyMessage={`No ${tab.toLowerCase()} orders.`}
          />
        )}

        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} />
          </Box>
        )}
      </Stack>
    </AppLayout>
  );
}
