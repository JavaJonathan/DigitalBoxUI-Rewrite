import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import type { OrderListItem, OrderStatus } from '../types';
import { formatDate, PARSE_STATUS_HINTS } from '../lib/format';
import { Mono } from './ui/Mono';
import { MarketplaceTag } from './ui/MarketplaceTag';
import { OrderStatusBadge } from './ui/StatusBadge';
import { RelativeTime } from './ui/RelativeTime';

type SortKey = 'shipDate' | 'title';

interface OrdersTableProps {
  orders: OrderListItem[];
  status: OrderStatus;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  sort?: SortKey | 'created';
  onSortChange?: (sort: SortKey) => void;
  onTogglePriority?: (order: OrderListItem) => void;
  onEditNote?: (order: OrderListItem, anchor: HTMLElement) => void;
  onUndoRow?: (order: OrderListItem) => void;
}

function isOverdue(order: OrderListItem) {
  if (order.status !== 'Open' || !order.shipDate) return false;
  return new Date(`${order.shipDate}T23:59:59`).getTime() < Date.now();
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
  onTogglePriority,
  onEditNote,
  onUndoRow,
}: OrdersTableProps) {
  const navigate = useNavigate();
  const isHistory = status !== 'Open';
  const allSelected = selectable && orders.length > 0 && orders.every((o) => selectedIds?.has(o.id));
  const someSelected = selectable && orders.some((o) => selectedIds?.has(o.id)) && !allSelected;
  const showFlag = !isHistory && !!onTogglePriority;

  const headCell = (key: SortKey, label: string) =>
    onSortChange ? (
      <TableSortLabel
        active={sort === key}
        direction="asc"
        hideSortIcon={sort !== key}
        onClick={() => onSortChange(key)}
      >
        {label}
      </TableSortLabel>
    ) : (
      label
    );

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <TableContainer
      className="db-fade-in"
      sx={{
        border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        borderRadius: 3,
        maxHeight: 'max(360px, calc(100dvh - 250px))',
        overflow: 'auto',
        bgcolor: 'surface.panel',
      }}
    >
      <Table
        stickyHeader
        size="small"
        sx={{ tableLayout: 'fixed', minWidth: isHistory ? 1100 : 1080 }}
      >
        {/*
          Fixed layout + an explicit colgroup. Every column except Order has a
          fixed width; Order takes a share of the viewport so long product
          titles get room; a small trailing spacer <col> keeps a little air on
          the right of very wide screens without letting the data columns drift
          apart. (Matching aria-hidden <td>s carry the spacer through the body.)
        */}
        <colgroup>
          {selectable && <col style={{ width: 40 }} />}
          {showFlag && <col style={{ width: 32 }} />}
          <col style={{ width: isHistory ? '36%' : '42%' }} />
          <col style={{ width: 124 }} />
          <col style={{ width: 60 }} />
          <col style={{ width: 128 }} />
          {isHistory ? (
            <>
              <col style={{ width: 100 }} />
              <col style={{ width: 116 }} />
              <col style={{ width: 128 }} />
            </>
          ) : (
            <col style={{ width: '17%' }} />
          )}
          <col style={{ width: 44 }} />
          <col />
        </colgroup>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox" sx={{ pl: 1.5 }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                  slotProps={{ input: { 'aria-label': 'Select all rows' } }}
                />
              </TableCell>
            )}
            {showFlag && <TableCell padding="checkbox" />}
            <TableCell>{headCell('title', 'Order')}</TableCell>
            <TableCell>Marketplace</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>{headCell('shipDate', 'Ship date')}</TableCell>
            {isHistory ? (
              <>
                <TableCell>Status</TableCell>
                <TableCell>{status === 'Shipped' ? 'Shipped' : 'Cancelled'}</TableCell>
                <TableCell>Operator</TableCell>
              </>
            ) : (
              <TableCell>Notes</TableCell>
            )}
            <TableCell padding="checkbox" />
            <TableCell aria-hidden sx={{ p: 0 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order, index) => {
            const overdue = isOverdue(order);
            const selected = selectedIds?.has(order.id) ?? false;
            return (
              <TableRow
                key={order.id}
                hover
                selected={selected}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="db-row-in"
                style={{ animationDelay: `${Math.min(index, 10) * 22}ms` }}
                sx={{
                  cursor: 'pointer',
                  '&:hover .db-row-hover': { opacity: 1 },
                  '&:hover .db-chevron': { opacity: 1, transform: 'translateX(0)' },
                }}
              >
                {selectable && (
                  <TableCell padding="checkbox" sx={{ pl: 1.5 }} onClick={stop}>
                    <Checkbox
                      checked={selected}
                      onChange={() => onToggle?.(order.id)}
                      slotProps={{ input: { 'aria-label': `Select order ${order.orderNumber || order.id}` } }}
                    />
                  </TableCell>
                )}

                {showFlag && (
                  <TableCell padding="checkbox" onClick={stop}>
                    <Tooltip title={order.isPriority ? 'Remove priority' : 'Mark priority'} arrow>
                      <IconButton
                        size="small"
                        onClick={() => onTogglePriority?.(order)}
                        aria-label={order.isPriority ? 'Remove priority' : 'Mark priority'}
                        sx={{
                          color: order.isPriority ? 'primary.main' : 'text.disabled',
                          opacity: order.isPriority ? 1 : 0,
                          transition: 'opacity 100ms ease, color 100ms ease',
                          '&:hover': { color: 'primary.main' },
                        }}
                        className={order.isPriority ? undefined : 'db-row-hover'}
                      >
                        {order.isPriority ? (
                          <FlagRoundedIcon sx={{ fontSize: 15 }} />
                        ) : (
                          <OutlinedFlagIcon sx={{ fontSize: 15 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}

                <TableCell sx={{ py: 0.75 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.125, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, minWidth: 0 }}>
                      <Mono muted={!order.orderNumber} sx={{ fontWeight: 550, whiteSpace: 'nowrap' }}>
                        {order.orderNumber || 'No order number'}
                      </Mono>
                      {!isHistory && order.parseStatus !== 'Parsed' && (
                        <Tooltip title={PARSE_STATUS_HINTS[order.parseStatus]} arrow>
                          {order.parseStatus === 'Failed' ? (
                            <ErrorOutlineRoundedIcon
                              sx={{ fontSize: 14, flexShrink: 0, color: 'error.main' }}
                            />
                          ) : (
                            <WarningAmberRoundedIcon
                              sx={{ fontSize: 14, flexShrink: 0, color: 'warning.main' }}
                            />
                          )}
                        </Tooltip>
                      )}
                      {isHistory && order.notes && (
                        <Tooltip title={order.notes} arrow>
                          <StickyNote2OutlinedIcon
                            sx={{ fontSize: 13, flexShrink: 0, color: 'text.disabled' }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {order.firstItemTitle || '—'}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <MarketplaceTag marketplace={order.marketplace} />
                </TableCell>

                <TableCell align="right">
                  <Tooltip
                    title={`${order.lineItemCount} line item${order.lineItemCount === 1 ? '' : 's'}`}
                    arrow
                    placement="left"
                  >
                    <Typography
                      component="span"
                      sx={{ fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums', cursor: 'default' }}
                    >
                      {order.totalQuantity}
                    </Typography>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                    <Typography component="span" sx={{ fontSize: '0.8125rem', color: order.shipDate ? 'text.primary' : 'text.disabled' }}>
                      {formatDate(order.shipDate)}
                    </Typography>
                    {overdue && (
                      <Tooltip title="Ship date has passed" arrow>
                        <WarningAmberRoundedIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                {isHistory ? (
                  <>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <RelativeTime value={status === 'Shipped' ? order.shippedAt : order.cancelledAt} />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.8125rem', color: order.actionedBy ? 'text.primary' : 'text.disabled' }}>
                        {order.actionedBy ?? '—'}
                      </Typography>
                    </TableCell>
                  </>
                ) : (
                  <TableCell
                    onClick={
                      onEditNote
                        ? (e) => {
                            stop(e);
                            onEditNote(order, e.currentTarget);
                          }
                        : undefined
                    }
                    sx={{ cursor: onEditNote ? 'pointer' : undefined }}
                  >
                    {order.notes ? (
                      <Tooltip title={order.notes} arrow>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {order.notes}
                        </Typography>
                      </Tooltip>
                    ) : onEditNote ? (
                      <StickyNote2OutlinedIcon
                        className="db-row-hover"
                        sx={{
                          fontSize: 14,
                          color: 'text.disabled',
                          opacity: 0,
                          transition: 'opacity 100ms ease',
                          display: 'block',
                        }}
                      />
                    ) : null}
                  </TableCell>
                )}

                <TableCell padding="checkbox" sx={{ pr: 1 }} onClick={onUndoRow ? stop : undefined}>
                  {isHistory && onUndoRow ? (
                    <Tooltip title="Reopen" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onUndoRow(order)}
                        aria-label="Reopen order"
                        className="db-row-hover"
                        sx={{ opacity: 0, transition: 'opacity 100ms ease' }}
                      >
                        <ReplayRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <ChevronRightIcon
                      className="db-chevron"
                      sx={{
                        fontSize: 16,
                        color: 'text.disabled',
                        opacity: 0,
                        transform: 'translateX(-4px)',
                        transition: 'opacity 120ms ease, transform 120ms ease',
                      }}
                    />
                  )}
                </TableCell>
                <TableCell aria-hidden sx={{ p: 0 }} />
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
