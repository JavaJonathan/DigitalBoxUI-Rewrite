import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useRealtimeEvent } from '../realtime/RealtimeContext';
import type { ActivityEvent } from '../realtime/activityConnection';

const VISIBLE_MS = 4_500;
const MAX_VISIBLE = 3;

const VERB_LABEL: Record<string, string> = {
  shipped: 'shipped',
  cancelled: 'cancelled',
  reopened: 'reopened',
  uploaded: 'uploaded',
};

const VERB_DOT: Record<string, string> = {
  shipped: 'success.main',
  cancelled: 'error.main',
  reopened: 'info.main',
  uploaded: 'text.disabled',
};

/**
 * Quiet, self-dismissing popups in the bottom-right corner when a coworker ships / cancels /
 * reopens / uploads. Deliberately understated — the opposite of the loud centre toast and
 * selection bar, which demand action; this is ambient awareness.
 */
export function ActivityFeed() {
  const [items, setItems] = useState<ActivityEvent[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useRealtimeEvent('activity', (evt) => {
    setItems((prev) => [...prev, evt].slice(-MAX_VISIBLE));
    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== evt.id));
    }, VISIBLE_MS);
    timers.current.push(timer);
  });

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 12, sm: 20 },
        bottom: { xs: 12, sm: 20 },
        zIndex: (t) => t.zIndex.snackbar - 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => {
        const count = item.count > 0 ? item.count : 1;
        return (
          <Box
            key={item.id}
            className="db-activity-in"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              maxWidth: 320,
              px: 3,
              py: 2.25,
              borderRadius: 1.5,
              bgcolor: 'surface.panel',
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              boxShadow: 'var(--db-shadow-md)',
              fontSize: '0.8125rem',
              color: 'text.primary',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                flexShrink: 0,
                bgcolor: VERB_DOT[item.verb] ?? 'text.disabled',
              }}
            />
            <Box component="span" sx={{ minWidth: 0 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                {item.actorName}
              </Box>{' '}
              {VERB_LABEL[item.verb] ?? item.verb} {count} {count === 1 ? 'order' : 'orders'}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
