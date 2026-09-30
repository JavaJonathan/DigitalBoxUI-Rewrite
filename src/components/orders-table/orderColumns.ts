import type { CSSProperties } from 'react';

/** One `<col>`: its width style, plus whether the column collapses on phones (see OrdersTable). */
export interface ColSpec {
  style?: CSSProperties;
  hideXs?: boolean;
  /** takes all remaining width on phones, where the percentage widths no longer make sense */
  fillXs?: boolean;
}

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
 *
 * `minWidth` is what the table needs before it scrolls sideways: low enough that a 1280px laptop
 * (content area about 920px next to the sidebar) fits without a horizontal scrollbar. Below `sm`
 * the `hideXs` columns collapse and their data moves into the Order cell.
 */
export function orderColumns({ isHistory, selectable, showFlag }: ColumnArgs): {
  minWidth: number;
  cols: ColSpec[];
} {
  const cols: ColSpec[] = [];
  if (selectable) cols.push({ style: { width: 40 } });
  if (showFlag) cols.push({ style: { width: 32 } });
  cols.push({ style: { width: isHistory ? '36%' : '42%' }, fillXs: true }); // Order
  cols.push({ style: { width: 124 }, hideXs: true }); // Marketplace
  cols.push({ style: { width: 60 }, hideXs: true }); // Qty
  cols.push({ style: { width: 128 }, hideXs: true }); // Ship date
  if (isHistory) {
    cols.push({ style: { width: 100 }, hideXs: true }); // Status
    cols.push({ style: { width: 116 }, hideXs: true }); // Shipped / Cancelled time
    cols.push({ style: { width: 128 }, hideXs: true }); // Operator
  } else {
    cols.push({ style: { width: '17%' }, hideXs: true }); // Notes
  }
  cols.push({ style: { width: 44 } }); // chevron / reopen
  cols.push({ hideXs: true }); // trailing spacer, absorbs slack on wide screens

  return { minWidth: isHistory ? 900 : 820, cols };
}
