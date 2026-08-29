import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { formatDateTime, relativeTime } from '../../lib/format';

export function RelativeTime({ value }: { value: string | null }) {
  if (!value)
    return (
      <Box component="span" sx={{ color: 'text.disabled' }}>
        —
      </Box>
    );
  return (
    <Tooltip title={formatDateTime(value)} placement="top" arrow>
      <Box
        component="span"
        sx={{ color: 'text.secondary', whiteSpace: 'nowrap', cursor: 'default' }}
      >
        {relativeTime(value)}
      </Box>
    </Tooltip>
  );
}
