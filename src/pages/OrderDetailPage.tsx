import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import { AppShell } from '../components/AppShell';
import { Mono } from '../components/ui/Mono';
import { MarketplaceTag } from '../components/ui/MarketplaceTag';
import { OrderStatusBadge, ParseStatusBadge } from '../components/ui/StatusBadge';
import { EventTimeline } from '../components/ui/EventTimeline';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import {
  getOrder,
  updateOrder,
  fetchPackingSlipObjectUrl,
  shipOrders,
  cancelOrders,
  undoOrders,
  setOrderPriority,
  setOrderNotes,
} from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { formatDate, pluralize, MARKETPLACE_LABELS } from '../lib/format';
import { MARKETPLACES, type Marketplace, type OrderDetail } from '../types';

interface EditLine {
  title: string;
  quantity: number;
  sku: string;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 0.75, alignItems: 'baseline' }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', width: 96, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ fontSize: '0.8125rem', minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { notify } = useToast();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('Unknown');
  const [shipDate, setShipDate] = useState('');
  const [lines, setLines] = useState<EditLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<'ship' | 'cancel' | 'undo' | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    let revoked = false;
    let url: string | null = null;
    fetchPackingSlipObjectUrl(id)
      .then((objectUrl) => {
        if (revoked) return URL.revokeObjectURL(objectUrl);
        url = objectUrl;
        setPdfUrl(objectUrl);
      })
      .catch(() => setPdfUrl(null));
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  const beginEdit = () => {
    if (!order) return;
    setOrderNumber(order.orderNumber);
    setMarketplace(order.marketplace);
    setShipDate(order.shipDate ?? '');
    setLines(
      order.lineItems.length > 0
        ? order.lineItems.map((li) => ({
            title: li.title,
            quantity: li.quantity,
            sku: li.sku ?? '',
          }))
        : [{ title: '', quantity: 1, sku: '' }],
    );
    setEditing(true);
  };

  const save = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateOrder(id, {
        orderNumber: orderNumber.trim(),
        marketplace,
        shipDate: shipDate || null,
        lineItems: lines
          .filter((l) => l.title.trim())
          .map((l) => ({ title: l.title.trim(), quantity: l.quantity, sku: l.sku.trim() || null })),
      });
      setOrder(updated);
      setEditing(false);
      notify('Order updated.', 'success');
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not save.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (actionedBy: string) => {
    if (!id) return;
    try {
      const result =
        action === 'ship'
          ? await shipOrders([id], actionedBy)
          : action === 'cancel'
            ? await cancelOrders([id], actionedBy)
            : await undoOrders([id], actionedBy);
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

  const saveNote = async () => {
    if (!id) return;
    setSavingNote(true);
    try {
      const updated = await setOrderNotes(id, noteDraft.trim() ? noteDraft.trim() : null);
      setOrder(updated);
      setEditingNote(false);
      notify('Note saved.', 'success');
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not save the note.'), 'error');
    } finally {
      setSavingNote(false);
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
          {/* left column */}
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
                  <Tooltip title={order.isPriority ? 'Remove priority' : 'Mark priority'} arrow>
                    <IconButton
                      size="small"
                      onClick={togglePriority}
                      aria-label={order.isPriority ? 'Remove priority' : 'Mark priority'}
                      sx={{ color: order.isPriority ? 'primary.main' : 'text.disabled' }}
                    >
                      {order.isPriority ? (
                        <FlagRoundedIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <OutlinedFlagIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </Tooltip>
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
                  {!editing && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                      onClick={beginEdit}
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
                    onClick={() => setAction('undo')}
                  >
                    Reopen order
                  </Button>
                </Stack>
              )}

              <Paper
                sx={{
                  p: 2.5,
                  border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                  borderRadius: 3,
                }}
              >
                {editing ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Order number"
                      size="small"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                    />
                    <TextField
                      label="Marketplace"
                      size="small"
                      select
                      value={marketplace}
                      onChange={(e) => setMarketplace(e.target.value as Marketplace)}
                    >
                      {MARKETPLACES.map((m) => (
                        <MenuItem key={m} value={m}>
                          {MARKETPLACE_LABELS[m]}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Ship date"
                      size="small"
                      type="date"
                      value={shipDate}
                      onChange={(e) => setShipDate(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <Divider />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                      Line items
                    </Typography>
                    {lines.map((line, index) => (
                      <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                          label="Title"
                          size="small"
                          fullWidth
                          value={line.title}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) =>
                                i === index ? { ...l, title: e.target.value } : l,
                              ),
                            )
                          }
                        />
                        <TextField
                          label="Qty"
                          size="small"
                          type="number"
                          sx={{ width: 84 }}
                          value={line.quantity}
                          slotProps={{ htmlInput: { min: 0 } }}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) =>
                                i === index
                                  ? {
                                      ...l,
                                      quantity: Math.max(
                                        0,
                                        Math.floor(Number(e.target.value) || 0),
                                      ),
                                    }
                                  : l,
                              ),
                            )
                          }
                        />
                        <IconButton
                          size="small"
                          onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                          disabled={lines.length === 1}
                          aria-label="Remove line item"
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
                      onClick={() =>
                        setLines((prev) => [...prev, { title: '', quantity: 1, sku: '' }])
                      }
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Add line item
                    </Button>

                    <Divider />
                    <Stack direction="row" spacing={1}>
                      <Button variant="contained" size="small" onClick={save} disabled={saving}>
                        {saving ? 'Saving…' : 'Save changes'}
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
                        Discard
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    <FieldRow label="Marketplace">
                      <MarketplaceTag marketplace={order.marketplace} />
                    </FieldRow>
                    <FieldRow label="Ship date">
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          color: order.shipDate ? 'text.primary' : 'text.disabled',
                        }}
                      >
                        {formatDate(order.shipDate)}
                      </Typography>
                    </FieldRow>
                    {order.actionedBy && <FieldRow label="Operator">{order.actionedBy}</FieldRow>}

                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                      Line items · {pluralize(order.totalQuantity, 'unit')}
                    </Typography>
                    <Stack spacing={1}>
                      {order.lineItems.map((li) => (
                        <Box
                          key={li.id}
                          sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                        >
                          <Box
                            sx={{
                              minWidth: 26,
                              height: 20,
                              px: 0.5,
                              mt: 0.125,
                              borderRadius: 1,
                              bgcolor: 'surface.sunken',
                              color: 'text.secondary',
                              fontSize: '0.6875rem',
                              fontWeight: 650,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            ×{li.quantity}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                              {li.title}
                            </Typography>
                            {li.sku && (
                              <Mono muted sx={{ fontSize: '0.6875rem' }}>
                                {li.sku}
                              </Mono>
                            )}
                          </Box>
                        </Box>
                      ))}
                      {order.lineItems.length === 0 && (
                        <Typography sx={{ fontSize: '0.8125rem', color: 'text.disabled' }}>
                          Nothing was parsed. Use Edit to enter the items manually.
                        </Typography>
                      )}
                    </Stack>
                  </>
                )}
              </Paper>

              <Paper
                sx={{
                  p: 2.5,
                  border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                  borderRadius: 3,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Note
                  </Typography>
                  {!editingNote && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setNoteDraft(order.notes ?? '');
                        setEditingNote(true);
                      }}
                    >
                      {order.notes ? 'Edit' : 'Add'}
                    </Button>
                  )}
                </Box>
                {editingNote ? (
                  <Stack spacing={1}>
                    <TextField
                      autoFocus
                      multiline
                      minRows={2}
                      maxRows={8}
                      size="small"
                      fullWidth
                      placeholder="e.g. fragile — call before ship"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 500 } }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {noteDraft.length}/500
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => setEditingNote(false)}
                          disabled={savingNote}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={saveNote}
                          disabled={savingNote}
                        >
                          {savingNote ? 'Saving…' : 'Save'}
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                ) : (
                  <Typography
                    sx={{
                      fontSize: '0.8125rem',
                      color: order.notes ? 'text.primary' : 'text.disabled',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {order.notes || 'No note.'}
                  </Typography>
                )}
              </Paper>

              <Box>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  Activity
                </Typography>
                <EventTimeline events={order.events} />
              </Box>
            </Stack>
          </Grid>

          {/* right column — packing slip */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper
              sx={{
                border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                borderRadius: 3,
                overflow: 'hidden',
                position: { md: 'sticky' },
                top: { md: 80 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  height: 44,
                  borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                  Packing slip
                </Typography>
                {pdfUrl && (
                  <Tooltip title="Open in new tab" arrow>
                    <IconButton
                      size="small"
                      component={Link}
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {pdfUrl ? (
                <Box
                  component="iframe"
                  src={`${pdfUrl}#toolbar=0`}
                  title="Packing slip"
                  sx={{
                    width: '100%',
                    height: { xs: 460, md: 'calc(100vh - 180px)' },
                    border: 'none',
                    display: 'block',
                    bgcolor: 'surface.inset',
                  }}
                />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    Packing slip unavailable.
                  </Typography>
                </Box>
              )}
            </Paper>
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
