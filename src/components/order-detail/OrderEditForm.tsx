import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { updateOrder } from '../../api/orders';
import { getApiErrorMessage } from '../../api/client';
import { useToast } from '../ToastProvider';
import { MARKETPLACE_LABELS } from '../../lib/format';
import { MARKETPLACES, type Marketplace, type OrderDetail } from '../../types';

interface EditLine {
  title: string;
  quantity: number;
  sku: string;
}

interface OrderEditFormProps {
  order: OrderDetail;
  onSaved: (updated: OrderDetail) => void;
  onCancel: () => void;
}

/** Correction form for an Open order. Seeds itself from `order`; mount with `key={order.id}`. */
export function OrderEditForm({ order, onSaved, onCancel }: OrderEditFormProps) {
  const { notify } = useToast();
  const [orderNumber, setOrderNumber] = useState(order.orderNumber);
  const [marketplace, setMarketplace] = useState<Marketplace>(order.marketplace);
  const [shipDate, setShipDate] = useState(order.shipDate ?? '');
  const [lines, setLines] = useState<EditLine[]>(() =>
    order.lineItems.length > 0
      ? order.lineItems.map((li) => ({ title: li.title, quantity: li.quantity, sku: li.sku ?? '' }))
      : [{ title: '', quantity: 1, sku: '' }],
  );
  const [saving, setSaving] = useState(false);

  const updateLine = (index: number, patch: Partial<EditLine>) =>
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateOrder(order.id, {
        orderNumber: orderNumber.trim(),
        marketplace,
        shipDate: shipDate || null,
        lineItems: lines
          .filter((l) => l.title.trim())
          .map((l) => ({ title: l.title.trim(), quantity: l.quantity, sku: l.sku.trim() || null })),
      });
      notify('Order updated.', 'success');
      onSaved(updated);
    } catch (err) {
      notify(getApiErrorMessage(err, 'Could not save.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
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
              onChange={(e) => updateLine(index, { title: e.target.value })}
            />
            <TextField
              label="Qty"
              size="small"
              type="number"
              sx={{ width: 84 }}
              value={line.quantity}
              slotProps={{ htmlInput: { min: 0 } }}
              onChange={(e) =>
                updateLine(index, {
                  quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                })
              }
            />
            <IconButton
              size="small"
              onClick={() => removeLine(index)}
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
          onClick={() => setLines((prev) => [...prev, { title: '', quantity: 1, sku: '' }])}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add line item
        </Button>

        <Divider />
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="text" size="small" onClick={onCancel} disabled={saving}>
            Discard
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
