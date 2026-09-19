import type { CSSProperties } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

/** Column geometry, as returned by `orders-table/orderColumns`. */
export interface TableLayout {
  minWidth: number;
  cols: (CSSProperties | undefined)[];
}

interface TableSkeletonProps {
  rows?: number;
  /**
   * Real column widths to mirror, so the skeleton and the table that replaces it occupy the
   * same grid. Pass `orderColumns(...)` for the queue / history tables.
   */
  layout?: TableLayout;
  /** Fallback when there is no `layout`: this many evenly-split columns. */
  columns?: number;
}

/**
 * Loading placeholder for a data table.
 *
 * Built from real `<Table>` / `<TableCell>` elements rather than flex rows, so it inherits the
 * theme's cell padding, borders and sticky header and lands on exactly the same geometry as the
 * loaded table. Anything else shifts the layout at the moment the data arrives.
 */
export function TableSkeleton({ rows = 8, layout, columns = 6 }: TableSkeletonProps) {
  const cols = layout?.cols ?? Array.from({ length: columns }, () => undefined);
  // In the orders layouts the primary (Order) column is the first percentage-width one; the
  // fixed-px columns before it are the checkbox / priority-flag gutters.
  const primaryIndex = layout ? cols.findIndex((c) => typeof c?.width === 'string') : 0;
  const primaryIsStacked = layout !== undefined && primaryIndex >= 0;

  return (
    <TableContainer>
      <Table size="small" sx={{ tableLayout: 'fixed', minWidth: layout?.minWidth }}>
        <colgroup>
          {cols.map((style, i) => (
            <col key={i} style={style} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {cols.map((_, c) => (
              <TableCell key={c}>
                <Skeleton variant="text" width={c === primaryIndex ? 64 : '60%'} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {cols.map((_, c) => (
                <TableCell key={c} sx={{ opacity: 1 - r * 0.07, py: primaryIsStacked ? 0.75 : 1 }}>
                  {c === primaryIndex && primaryIsStacked ? (
                    // The orders table stacks the order number over the item title, so the
                    // placeholder has to be two lines or the rows jump shorter when data lands.
                    <>
                      <Skeleton variant="text" width="55%" />
                      <Skeleton variant="text" width="85%" sx={{ fontSize: '0.75rem' }} />
                    </>
                  ) : (
                    <Skeleton variant="text" width={c === primaryIndex ? '80%' : '55%'} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
