import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { PAGE_SIZE_OPTIONS } from '../../lib/constants';

interface PaginationBarProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  /** Total matching rows across all pages (from the server's `PagedResult.total`). */
  total: number;
  /** Singular noun for the range label — `order` → "Showing 1–25 of 42 orders". */
  noun?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Shared footer for the paged tables: a "Showing X–Y of Z" range on the left, the page
 * controls and a rows-per-page picker on the right. The page nav hides itself when everything
 * fits on one page; the size picker always shows so the operator can widen the view.
 */
export function PaginationBar({
  page,
  pageSize,
  total,
  noun = 'order',
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Clamp to `total` so a stale page (e.g. after a realtime refresh shrinks the list) still
  // reads sensibly rather than "Showing 51–75 of 42".
  const start = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        pt: 0.5,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
      >
        Showing {start}–{end} of {total} {total === 1 ? noun : `${noun}s`}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            size="small"
          />
        )}
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          size="small"
          aria-label="Rows per page"
          sx={{ '& .MuiSelect-select': { py: 0.75 } }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              {n} / page
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}
