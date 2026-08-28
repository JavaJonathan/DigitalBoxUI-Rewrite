import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import IconButton from '@mui/material/IconButton';
import type { Marketplace } from '../types';
import { MARKETPLACE_LABELS } from '../lib/format';
import { MARKETPLACE_COLORS } from '../theme';

export interface ToolbarState {
  q: string;
  marketplace: Marketplace | '';
  priority: boolean;
}

interface QueueToolbarProps extends ToolbarState {
  showMarketplace?: boolean;
  showPriority?: boolean;
  onChange: (next: ToolbarState) => void;
}

const MARKETS: Marketplace[] = ['Amazon', 'Ebay', 'Walmart', 'Shopify', 'Unknown'];

export function QueueToolbar({
  q,
  marketplace,
  priority,
  showMarketplace = true,
  showPriority = false,
  onChange,
}: QueueToolbarProps) {
  const [text, setText] = useState(q);
  const latest = useRef({ marketplace, priority });
  latest.current = { marketplace, priority };

  // Debounce the free-text field; the toggles below fire immediately.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== q) onChange({ q: text, ...latest.current });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => setText(q), [q]);

  const emit = (patch: Partial<ToolbarState>) =>
    onChange({ q: text, marketplace, priority, ...patch });

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          height: 34,
          px: 1.25,
          minWidth: { xs: '100%', sm: 300 },
          flex: { sm: '0 1 340px' },
          borderRadius: 1.75,
          border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
          bgcolor: 'surface.panel',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (t) => `0 0 0 3px ${(t.vars ?? t).palette.primary.main}29`,
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        <InputBase
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search order number, item, or note…"
          sx={{ flex: 1, fontSize: '0.8125rem' }}
        />
        {text && (
          <IconButton size="small" onClick={() => setText('')} aria-label="Clear search" sx={{ p: 0.25 }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>

      {showPriority && (
        <ToggleButton
          value="priority"
          size="small"
          selected={priority}
          onChange={() => emit({ priority: !priority })}
          sx={{
            border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
            borderRadius: '7px !important',
            px: 1.25,
            height: 34,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.secondary',
            textTransform: 'none',
            gap: 0.75,
            '&.Mui-selected': {
              bgcolor: (t) => `${(t.vars ?? t).palette.primary.main}14`,
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': { bgcolor: (t) => `${(t.vars ?? t).palette.primary.main}1f` },
            },
          }}
        >
          <FlagRoundedIcon sx={{ fontSize: 14 }} />
          Priority
        </ToggleButton>
      )}

      {showMarketplace && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={marketplace || 'all'}
          onChange={(_, val) => emit({ marketplace: val === 'all' || !val ? '' : (val as Marketplace) })}
          sx={{
            gap: 0.5,
            flexWrap: 'wrap',
            maxWidth: '100%',
            '& .MuiToggleButton-root': {
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
              borderRadius: '7px !important',
              px: 1.25,
              height: 34,
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'text.secondary',
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'surface.sunken',
                color: 'text.primary',
                borderColor: (t) => (t.vars ?? t).palette.surface.borderStrong,
              },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          {MARKETS.map((m) => (
            <ToggleButton key={m} value={m}>
              <Box
                component="span"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: MARKETPLACE_COLORS[m],
                  mr: 0.75,
                }}
              />
              {MARKETPLACE_LABELS[m]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </Box>
  );
}
