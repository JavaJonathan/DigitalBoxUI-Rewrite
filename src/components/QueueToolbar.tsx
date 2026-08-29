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

const isTypingTarget = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable;
};

export function QueueToolbar({
  q,
  marketplace,
  priority,
  showMarketplace = true,
  showPriority = false,
  onChange,
}: QueueToolbarProps) {
  const [text, setText] = useState(q);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // `/` from anywhere focuses the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const emit = (patch: Partial<ToolbarState>) =>
    onChange({ q: text, marketplace, priority, ...patch });

  const hasFilters = showMarketplace || showPriority;

  return (
    <Box sx={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: 44,
          px: '14px',
          flex: '1 1 300px',
          maxWidth: hasFilters ? { md: 640 } : 'none',
          minWidth: { xs: '100%', sm: 260 },
          borderRadius: '10px',
          border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
          bgcolor: 'surface.panel',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (t) => `0 0 0 3px ${(t.vars ?? t).palette.primary.main}29`,
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 19, color: focused ? 'primary.main' : 'text.disabled' }} />
        <InputBase
          inputRef={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && text) {
              setText('');
              e.stopPropagation();
            }
          }}
          placeholder="Search order number, item, or note…"
          sx={{ flex: 1, fontSize: '0.875rem' }}
        />
        {text ? (
          <IconButton
            size="small"
            onClick={() => setText('')}
            aria-label="Clear search"
            sx={{ p: '2px' }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        ) : (
          <Box
            component="kbd"
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontFamily: 'var(--db-mono)',
              fontSize: '0.75rem',
              lineHeight: 1,
              px: '6px',
              py: '3px',
              borderRadius: '6px',
              border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
              bgcolor: 'surface.sunken',
              color: 'text.disabled',
            }}
          >
            /
          </Box>
        )}
      </Box>

      {hasFilters && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            ml: { md: 'auto' },
          }}
        >
          {showPriority && (
            <ToggleButton
              value="priority"
              size="small"
              selected={priority}
              onChange={() => emit({ priority: !priority })}
              sx={{
                border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                borderRadius: '9px !important',
                px: '14px',
                height: 40,
                fontSize: '0.8125rem',
                fontWeight: 550,
                color: 'text.secondary',
                textTransform: 'none',
                gap: '8px',
                '&.Mui-selected': {
                  bgcolor: (t) =>
                    `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 12%, transparent)`,
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  '&:hover': {
                    bgcolor: (t) =>
                      `color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 18%, transparent)`,
                  },
                },
              }}
            >
              <FlagRoundedIcon sx={{ fontSize: 16 }} />
              Priority
            </ToggleButton>
          )}

          {showMarketplace && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={marketplace || 'all'}
              onChange={(_, val) =>
                emit({ marketplace: val === 'all' || !val ? '' : (val as Marketplace) })
              }
              sx={{
                gap: '6px',
                flexWrap: 'wrap',
                maxWidth: '100%',
                '& .MuiToggleButton-root': {
                  border: (t) => `1px solid ${(t.vars ?? t).palette.surface.border}`,
                  borderRadius: '9px !important',
                  px: '13px',
                  height: 40,
                  fontSize: '0.8125rem',
                  fontWeight: 550,
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
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: MARKETPLACE_COLORS[m],
                      mr: '8px',
                      boxShadow: `0 0 0 3px ${MARKETPLACE_COLORS[m]}22`,
                    }}
                  />
                  {MARKETPLACE_LABELS[m]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
        </Box>
      )}
    </Box>
  );
}
