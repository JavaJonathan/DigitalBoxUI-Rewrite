import { useNavigate } from 'react-router-dom';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { OrderListItem, OrderStatus } from '../types';
import { formatDate, formatDateTime, MARKETPLACE_LABELS, parseStatusColor, PARSE_STATUS_LABELS } from '../lib/format';

interface OrdersTableProps {
  orders: OrderListItem[];
  status: OrderStatus;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  sort?: 'shipDate' | 'title' | 'created';
  onSortChange?: (sort: 'shipDate' | 'title') => void;
  emptyMessage?: string;
}

export function OrdersTable({
  orders,
  status,
  selectable = false,
  selectedIds,
  onToggle,
  onToggleAll,
  sort,
  onSortChange,
  emptyMessage = 'No orders found.',
}: OrdersTableProps) {
  const navigate = useNavigate();
  const isHistory = status !== 'Open';
  const allSelected = selectable && orders.length > 0 && orders.every((o) => selectedIds?.has(o.id));
  const someSelected = selectable && orders.some((o) => selectedIds?.has(o.id)) && !allSelected;

  if (orders.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                />
              </TableCell>
            )}
            <TableCell sortDirection={false}>
              {onSortChange ? (
                <TableSortLabel active={sort === 'title'} direction="asc" onClick={() => onSortChange('title')}>
                  Order / first item
                </TableSortLabel>
              ) : (
                'Order / first item'
              )}
            </TableCell>
            <TableCell>Marketplace</TableCell>
            <TableCell align="right">Items</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>
              {onSortChange ? (
                <TableSortLabel active={sort === 'shipDate'} direction="asc" onClick={() => onSortChange('shipDate')}>
                  Ship date
                </TableSortLabel>
              ) : (
                'Ship date'
              )}
            </TableCell>
            {isHistory ? (
              <>
                <TableCell>{status === 'Shipped' ? 'Shipped' : 'Cancelled'}</TableCell>
                <TableCell>By</TableCell>
              </>
            ) : (
              <TableCell>Parse</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              hover
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              {selectable && (
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds?.has(order.id) ?? false}
                    onChange={() => onToggle?.(order.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {order.orderNumber || <em>(no order #)</em>}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={MARKETPLACE_LABELS[order.marketplace]} size="small" variant="outlined" />
              </TableCell>
              <TableCell align="right">{order.lineItemCount}</TableCell>
              <TableCell align="right">{order.totalQuantity}</TableCell>
              <TableCell>{formatDate(order.shipDate)}</TableCell>
              {isHistory ? (
                <>
                  <TableCell>
                    {formatDateTime(status === 'Shipped' ? order.shippedAt : order.cancelledAt)}
                  </TableCell>
                  <TableCell>{order.actionedBy ?? '—'}</TableCell>
                </>
              ) : (
                <TableCell>
                  {order.parseStatus === 'Parsed' ? (
                    <Box component="span" sx={{ color: 'text.disabled' }}>OK</Box>
                  ) : (
                    <Chip
                      label={PARSE_STATUS_LABELS[order.parseStatus]}
                      size="small"
                      color={parseStatusColor(order.parseStatus)}
                    />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
