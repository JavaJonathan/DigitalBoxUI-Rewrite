import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { AppShell } from '../components/AppShell';
import { Mono } from '../components/ui/Mono';
import { PriorityToggle } from '../components/ui/PriorityToggle';
import { OrderStatusBadge, ParseStatusBadge } from '../components/ui/StatusBadge';
import { EventTimeline } from '../components/ui/EventTimeline';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { OrderInfoPanel } from '../components/order-detail/OrderInfoPanel';
import { OrderEditForm } from '../components/order-detail/OrderEditForm';
import { OrderNoteCard } from '../components/order-detail/OrderNoteCard';
import { PackingSlipPanel } from '../components/order-detail/PackingSlipPanel';
import {
  getOrder,
  shipOrders,
  cancelOrders,
  undoOrders,
  setOrderPriority,
  setOrderNotes,
} from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ToastProvider';
import { SlipFolderField } from '../components/SlipFolderField';
import { useDownloadSlipsOnShip } from '../hooks/useDownloadSlipsOnShip';
import { useSlipDelivery } from '../hooks/useSlipDelivery';
import { useRealtimeEvent } from '../realtime/RealtimeContext';
import { QUEUE_SYNC_DEBOUNCE_MS } from '../lib/constants';
import { buildSlipRefs } from '../lib/slipFolder';
import type { OrderDetail } from '../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { notify } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState<'ship' | 'cancel' | 'reopen' | null>(null);

  const [downloadSlips, setDownloadSlips] = useDownloadSlipsOnShip();
  const { folder: slipFolder, deliver: deliverSlips } = useSlipDelivery();
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // `background` re-fetches without the skeleton, so an open edit form isn't remounted.
  const load = useCallback(
    async (background = false) => {
      if (!id) return;
      if (!background) {
        setLoading(true);
        setError(null);
      }
      try {
        setOrder(await getOrder(id));
      } catch (err) {
        if (!background) setError(getApiErrorMessage(err, 'Could not load this order.'));
      } finally {
        if (!background) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  // A coworker shipped / cancelled / edited something; keep this page's status current.
  useRealtimeEvent('queueChanged', () => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => load(true), QUEUE_SYNC_DEBOUNCE_MS);
  });
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  const runAction = async () => {
    if (!id) return;
    const shipping = action === 'ship';
    // Snapshot before the reload replaces the order.
    const refs = shipping && downloadSlips && order ? buildSlipRefs([id], () => order) : [];
    try {
      const result = shipping
        ? await shipOrders([id])
        : action === 'cancel'
          ? await cancelOrders([id])
          : await undoOrders([id]); // action === 'reopen'
      // Not open (or reopenable) any more, e.g. a coworker got there first.
      const applied = result.updated > 0;
      notify(result.message, applied ? 'success' : 'warning');
      setAction(null);
      load();
      if (applied && refs.length) await deliverSlips(refs);
    } catch (err) {
      notify(getApiErrorMessage(err, 'Action failed.'), 'error');
    }
  };

  const togglePriority = async () => {
    if (!order || !id) return;
    try {
      const updated = await setOrderPriority(id, !order.isPriority);
      setOrder(updated);
      notify(updated.isPriority ? 'Marked priority.' : 'Priority removed.', 'success');
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not update priority.'), 'error');
    }
  };

  const saveNote = async (notes: string | null) => {
    if (!id) return;
    try {
      setOrder(await setOrderNotes(id, notes));
      notify('Note saved.', 'success');
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not save the note.'), 'error');
    }
  };

  const isOpen = order?.status === 'Open';

  return (
    <AppShell title="Order">
      <Button
        component={RouterLink}
        to="/"
        variant="text"
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2, ml: -1 }}
      >
        Back to queue
      </Button>

      {loading ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Skeleton variant="rounded" height={360} />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Skeleton variant="rounded" height={560} />
          </Grid>
        </Grid>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : order ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={2.5}>
              <Box>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Mono copyable sx={{ fontSize: '1rem', fontWeight: 600 }}>
                    {order.orderNumber || 'No order number'}
                  </Mono>
                  <PriorityToggle isPriority={order.isPriority} onToggle={togglePriority} />
                </Stack>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <OrderStatusBadge status={order.status} />
                  <ParseStatusBadge status={order.parseStatus} />
                </Stack>
              </Box>

              {isOpen ? (
                <Stack direction="row" spacing={1}>
                  {isAdmin && !editing && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<LocalShippingOutlinedIcon />}
                    onClick={() => setAction('ship')}
                  >
                    Ship
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlinedIcon />}
                    onClick={() => setAction('cancel')}
                    sx={{
                      color: 'error.main',
                      borderColor: (t) => (t.vars ?? t).palette.error.light,
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReplayRoundedIcon />}
                    onClick={() => setAction('reopen')}
                  >
                    Reopen order
                  </Button>
                </Stack>
              )}

              {editing ? (
                <OrderEditForm
                  key={order.id}
                  order={order}
                  onSaved={(updated) => {
                    setOrder(updated);
                    setEditing(false);
                  }}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <OrderInfoPanel order={order} />
              )}

              <OrderNoteCard notes={order.notes} onSave={saveNote} />

              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Activity
                </Typography>
                <EventTimeline events={order.events} />
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <PackingSlipPanel orderId={order.id} />
          </Grid>
        </Grid>
      ) : null}

      <ConfirmActionDialog
        open={action !== null}
        intent={action ?? 'ship'}
        count={1}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      >
        {action === 'ship' && (
          <Box sx={{ mt: 1.5 }}>
            <FormControlLabel
              sx={{ display: 'flex' }}
              control={
                <Checkbox
                  size="small"
                  checked={downloadSlips}
                  onChange={(e) => setDownloadSlips(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Save packing slip after shipping
                </Typography>
              }
            />
            {downloadSlips && (
              <SlipFolderField
                supported={slipFolder.supported}
                name={slipFolder.name}
                onChoose={slipFolder.choose}
                onForget={slipFolder.forget}
              />
            )}
          </Box>
        )}
      </ConfirmActionDialog>
    </AppShell>
  );
}
