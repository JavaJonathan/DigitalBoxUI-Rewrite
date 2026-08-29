import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Checkbox from '@mui/material/Checkbox';
import type { OrderListItem, OrderStatus } from '../types';
import { OrdersTableRow } from './orders-table/OrdersTableRow';
import { orderColumns } from './orders-table/orderColumns';

type SortKey = 'shipDate' | 'title';

interface OrdersTableProps {
  orders: OrderListItem[];
  /** The order status being shown; also selects the view — `Open` = queue, else = history. */
  status: OrderStatus;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  sort?: SortKey;
  onSortChange?: (sort: SortKey) => void;
  onTogglePriority?: (order: OrderListItem) => void;
  onEditNote?: (order: OrderListItem, anchor: HTMLElement) => void;
  onReopenRow?: (order: OrderListItem) => void;
}

/** One table for both the queue and history views (`status` picks which). */
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
  onReopenRow,
}: OrdersTableProps) {
  const isHistory = status !== 'Open';
  const showFlag = !isHistory && !!onTogglePriority;
  const allSelected =
    selectable && orders.length > 0 && orders.every((o) => selectedIds?.has(o.id));
  const someSelected = selectable && orders.some((o) => selectedIds?.has(o.id)) && !allSelected;
  const { minWidth, cols } = orderColumns({ isHistory, selectable, showFlag });

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

  return (
    <TableContainer
      className="db-fade-in"
      sx={{
        border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
        maxHeight: 'max(360px, calc(100dvh - 250px))',
        overflow: 'auto',
        bgcolor: 'surface.panel',
      }}
    >
      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth }}>
        <colgroup>
          {cols.map((style, i) => (
            <col key={i} style={style} />
          ))}
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
          {orders.map((order, index) => (
            <OrdersTableRow
              key={order.id}
              order={order}
              index={index}
              isHistory={isHistory}
              status={status}
              selectable={selectable}
              selected={selectedIds?.has(order.id) ?? false}
              showFlag={showFlag}
              onToggle={onToggle}
              onTogglePriority={onTogglePriority}
              onEditNote={onEditNote}
              onReopenRow={onReopenRow}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
