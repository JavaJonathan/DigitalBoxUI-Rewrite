import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AppLayout } from '../components/AppLayout';
import { getOrder, updateOrder, fetchPackingSlipObjectUrl } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import { useToast } from '../components/ToastProvider';
import { formatDateTime, MARKETPLACE_LABELS, parseStatusColor, PARSE_STATUS_LABELS } from '../lib/format';
import { MARKETPLACES, type Marketplace, type OrderDetail } from '../types';

interface EditLine {
  title: string;
  quantity: number;
  sku: string;
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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(id);
      setOrder(data);
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
        if (revoked) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
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
        ? order.lineItems.map((li) => ({ title: li.title, quantity: li.quantity, sku: li.sku ?? '' }))
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
        shipDate: shipDate ? shipDate : null,
        lineItems: lines
          .filter((l) => l.title.trim().length > 0)
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

  return (
    <AppLayout>
      <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to queue
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : order ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h6">{order.orderNumber || '(no order #)'}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip size="small" label={order.status} />
                    <Chip size="small" variant="outlined" label={MARKETPLACE_LABELS[order.marketplace]} />
                    {order.parseStatus !== 'Parsed' && (
                      <Chip
                        size="small"
                        color={parseStatusColor(order.parseStatus)}
                        label={PARSE_STATUS_LABELS[order.parseStatus]}
                      />
                    )}
                  </Stack>
                </Box>
                {order.status === 'Open' && !editing && (
                  <Button variant="outlined" onClick={beginEdit}>
                    Edit
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

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

                  <Typography variant="subtitle2">Line items</Typography>
                  {lines.map((line, index) => (
                    <Stack key={index} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <TextField
                        label="Title"
                        size="small"
                        fullWidth
                        value={line.title}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l, i) => (i === index ? { ...l, title: e.target.value } : l)),
                          )
                        }
                      />
                      <TextField
                        label="Qty"
                        size="small"
                        type="number"
                        sx={{ width: 90 }}
                        value={line.quantity}
                        slotProps={{ htmlInput: { min: 0 } }}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((l, i) =>
                              i === index
                                ? { ...l, quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) }
                                : l,
                            ),
                          )
                        }
                      />
                      <IconButton
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                        disabled={lines.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setLines((prev) => [...prev, { title: '', quantity: 1, sku: '' }])}
                  >
                    Add line item
                  </Button>

                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={save} disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <Detail label="Ship date" value={order.shipDate ?? '—'} />
                  <Detail label="Total quantity" value={String(order.totalQuantity)} />
                  {order.actionedBy && <Detail label="Actioned by" value={order.actionedBy} />}
                  <Divider sx={{ my: 1 }} />
                  {order.lineItems.map((li) => (
                    <Box key={li.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2">{li.title}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        × {li.quantity}
                      </Typography>
                    </Box>
                  ))}
                  {order.lineItems.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No line items were parsed. Use Edit to add them.
                    </Typography>
                  )}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                History
              </Typography>
              <Stack spacing={0.5}>
                {order.events.map((event, i) => (
                  <Typography key={i} variant="caption" color="text.secondary">
                    {formatDateTime(event.occurredAt)} — {event.type}
                    {event.actor ? ` by ${event.actor}` : ''}
                    {event.detail ? ` · ${event.detail}` : ''}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Packing slip</Typography>
                {pdfUrl && (
                  <Link href={pdfUrl} target="_blank" rel="noreferrer">
                    Open in new tab
                  </Link>
                )}
              </Box>
              {pdfUrl ? (
                <Box
                  component="iframe"
                  src={pdfUrl}
                  title="Packing slip"
                  sx={{ width: '100%', height: { xs: 400, md: 640 }, border: 'none' }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Packing slip unavailable.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </AppLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
