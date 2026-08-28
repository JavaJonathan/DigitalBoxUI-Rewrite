import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { OrderEvent } from '../../types';
import { relativeTime, formatDateTime } from '../../lib/format';
import Tooltip from '@mui/material/Tooltip';

const DOT_COLOR: Record<string, string> = {
  Created: 'text.disabled',
  Edited: 'warning.main',
  Shipped: 'success.main',
  Cancelled: 'error.main',
};

export function EventTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <Box sx={{ position: 'relative', pl: 2.5 }}>
      <Box
        sx={{
          position: 'absolute',
          left: 4,
          top: 6,
          bottom: 6,
          width: '1px',
          bgcolor: 'surface.border',
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
        {events.map((event, i) => (
          <Box key={i} sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                left: -20,
                top: 4,
                width: 9,
                height: 9,
                borderRadius: '50%',
                bgcolor: DOT_COLOR[event.type] ?? 'text.disabled',
                border: (t) => `2px solid ${(t.vars ?? t).palette.surface.panel}`,
                boxSizing: 'content-box',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 550 }}>
                {event.type}
                {event.actor && (
                  <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                    {' '}
                    by {event.actor}
                  </Box>
                )}
              </Typography>
              <Tooltip title={formatDateTime(event.occurredAt)} placement="top" arrow>
                <Typography component="span" sx={{ fontSize: '0.6875rem', color: 'text.disabled' }}>
                  {relativeTime(event.occurredAt)}
                </Typography>
              </Tooltip>
            </Box>
            {event.detail && (
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                {event.detail}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
