import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Box sx={{ p: 0 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <Box
          key={r}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: 2,
            height: 44,
            borderBottom: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            '&:last-of-type': { borderBottom: 'none' },
          }}
        >
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton
              key={c}
              variant="text"
              sx={{
                flex: c === 0 ? '2 1 0' : '1 1 0',
                maxWidth: c === 0 ? 260 : 120,
                opacity: 1 - r * 0.07,
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
