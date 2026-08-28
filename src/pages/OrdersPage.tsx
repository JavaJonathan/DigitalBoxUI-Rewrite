import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CancelIcon from '@mui/icons-material/Cancel';
import { AppLayout } from '../components/AppLayout';
import { FilterBar } from '../components/FilterBar';
import { OrdersTable } from '../components/OrdersTable';
import { UploadDialog } from '../components/UploadDialog';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
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
    <AppLayout
      actions={
        <Button
          variant="contained"
          color="inherit"
          startIcon={<UploadFileIcon />}
          onClick={() => setUploadOpen(true)}
          sx={{ color: 'primary.main', bgcolor: '#fff' }}
        >
          Upload slips
        </Button>
      }
    >
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5">Open orders</Typography>
          <Typography variant="body2" color="text.secondary">
            {selected.size} selected · {data?.total ?? 0} total
          </Typography>
        </Box>

        <FilterBar
          q={q}
          marketplace={marketplace}
          onChange={(next) => {
            setQ(next.q);
            setMarketplace(next.marketplace);
            setPage(1);
          }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<LocalShippingIcon />}
            disabled={selected.size === 0}
            onClick={() => setAction('ship')}
          >
            Ship ({selected.size})
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CancelIcon />}
            disabled={selected.size === 0}
            onClick={() => setAction('cancel')}
          >
            Cancel ({selected.size})
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
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
            emptyMessage="No open orders. Upload some packing slips to get started."
          />
        )}

        {pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} />
          </Box>
        )}
      </Stack>

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refresh} />

      <ConfirmActionDialog
        open={action !== null}
        title={action === 'ship' ? 'Ship orders' : 'Cancel orders'}
        count={selected.size}
        confirmLabel={action === 'ship' ? 'Ship' : 'Cancel orders'}
        confirmColor={action === 'ship' ? 'success' : 'error'}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      />
    </AppLayout>
  );
}
