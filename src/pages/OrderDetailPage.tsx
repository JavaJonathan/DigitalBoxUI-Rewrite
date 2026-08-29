import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setOrder(await getOrder(id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!id) return;
    try {
      const result =
        action === 'ship'
          ? await shipOrders([id])
          : action === 'cancel'
            ? await cancelOrders([id])
            : await undoOrders([id]); // action === 'reopen'
      notify(result.message, 'success');
      setAction(null);
      load();
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
        startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 16 }} />}
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
                      startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<LocalShippingOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setAction('ship')}
                  >
                    Ship
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlinedIcon sx={{ fontSize: 15 }} />}
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
                    startIcon={<ReplayRoundedIcon sx={{ fontSize: 15 }} />}
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
      />
    </AppShell>
  );
}
