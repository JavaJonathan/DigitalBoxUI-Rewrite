import type { CSSProperties } from 'react';

interface ColumnArgs {
  isHistory: boolean;
  selectable: boolean;
  showFlag: boolean;
}

/**
 * Fixed-layout column widths for OrdersTable, kept next to `minWidth` because the two are
 * coupled. The order of `cols` must match the `<th>` / `<td>` order in the row:
 * [checkbox?] [flag?] Order · Marketplace · Qty · Ship date · (Status · When · Operator | Notes)
 * · trailing-icon · spacer.
 */
export function orderColumns({ isHistory, selectable, showFlag }: ColumnArgs): {
  minWidth: number;
  cols: (CSSProperties | undefined)[];
} {
  const cols: (CSSProperties | undefined)[] = [];
  if (selectable) cols.push({ width: 40 });
  if (showFlag) cols.push({ width: 32 });
  cols.push({ width: isHistory ? '36%' : '42%' }); // Order
  cols.push({ width: 124 }); // Marketplace
  cols.push({ width: 60 }); // Qty
  cols.push({ width: 128 }); // Ship date
  if (isHistory) {
    cols.push({ width: 100 }); // Status
    cols.push({ width: 116 }); // Shipped / Cancelled time
    cols.push({ width: 128 }); // Operator
  } else {
    cols.push({ width: '17%' }); // Notes
  }
  cols.push({ width: 44 }); // chevron / reopen
  cols.push(undefined); // trailing spacer — absorbs slack on wide screens

  return { minWidth: isHistory ? 1100 : 1080, cols };
}
