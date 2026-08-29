import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import type { OrderListItem, OrderStatus } from '../../types';
import { formatDate, PARSE_STATUS_HINTS } from '../../lib/format';
import { Mono } from '../ui/Mono';
import { MarketplaceTag } from '../ui/MarketplaceTag';
import { PriorityToggle } from '../ui/PriorityToggle';
import { OrderStatusBadge } from '../ui/StatusBadge';
import { RelativeTime } from '../ui/RelativeTime';

/** Row stagger: nth row starts `n * STEP` ms later, capped so long lists don't lag. */
const STAGGER_STEP_MS = 22;
const STAGGER_MAX_ROWS = 10;

function isOverdue(order: OrderListItem) {
  if (order.status !== 'Open' || !order.shipDate) return false;
  return new Date(`${order.shipDate}T23:59:59`).getTime() < Date.now();
}

const stop = (e: MouseEvent) => e.stopPropagation();

interface OrdersTableRowProps {
  order: OrderListItem;
  index: number;
  isHistory: boolean;
  status: OrderStatus;
  selectable: boolean;
  selected: boolean;
  showFlag: boolean;
  onToggle?: (id: string) => void;
  onTogglePriority?: (order: OrderListItem) => void;
  onEditNote?: (order: OrderListItem, anchor: HTMLElement) => void;
  onReopenRow?: (order: OrderListItem) => void;
}

/** The order number + parse-warning / note-present icon + first-item title. */
function OrderPrimaryCell({ order, isHistory }: { order: OrderListItem; isHistory: boolean }) {
  return (
    <TableCell sx={{ py: 0.75 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.125,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
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
  );
}

/** Queue-only Notes cell: shows the note text (click to edit) or a hover-reveal add icon. */
function NotesCell({
  order,
  onEditNote,
}: {
  order: OrderListItem;
  onEditNote?: (order: OrderListItem, anchor: HTMLElement) => void;
}) {
  return (
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
  );
}

export function OrdersTableRow({
  order,
  index,
  isHistory,
  status,
  selectable,
  selected,
  showFlag,
  onToggle,
  onTogglePriority,
  onEditNote,
  onReopenRow,
}: OrdersTableRowProps) {
  const navigate = useNavigate();
  const overdue = isOverdue(order);

  return (
    <TableRow
      hover
      selected={selected}
      onClick={() => navigate(`/orders/${order.id}`)}
      className="db-row-in"
      style={{ animationDelay: `${Math.min(index, STAGGER_MAX_ROWS) * STAGGER_STEP_MS}ms` }}
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
            slotProps={{
              input: { 'aria-label': `Select order ${order.orderNumber || order.id}` },
            }}
          />
        </TableCell>
      )}

      {showFlag && (
        <TableCell padding="checkbox" onClick={stop}>
          <PriorityToggle
            isPriority={order.isPriority}
            onToggle={() => onTogglePriority?.(order)}
            iconSize={15}
            className={order.isPriority ? undefined : 'db-row-hover'}
            sx={{
              opacity: order.isPriority ? 1 : 0,
              transition: 'opacity 100ms ease, color 100ms ease',
              '&:hover': { color: 'primary.main' },
            }}
          />
        </TableCell>
      )}

      <OrderPrimaryCell order={order} isHistory={isHistory} />

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
          <Typography
            component="span"
            sx={{
              fontSize: '0.8125rem',
              color: order.shipDate ? 'text.primary' : 'text.disabled',
            }}
          >
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
            <Typography
              sx={{
                fontSize: '0.8125rem',
                color: order.actionedBy ? 'text.primary' : 'text.disabled',
              }}
            >
              {order.actionedBy ?? '—'}
            </Typography>
          </TableCell>
        </>
      ) : (
        <NotesCell order={order} onEditNote={onEditNote} />
      )}

      <TableCell padding="checkbox" sx={{ pr: 1 }} onClick={onReopenRow ? stop : undefined}>
        {isHistory && onReopenRow ? (
          <Tooltip title="Reopen" arrow>
            <IconButton
              size="small"
              onClick={() => onReopenRow(order)}
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
}
