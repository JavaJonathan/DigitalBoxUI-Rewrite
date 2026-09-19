import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import { alpha } from '@mui/material/styles';
import { MARKETPLACES, type Marketplace } from '../types';
import { MARKETPLACE_LABELS } from '../lib/format';
import { CONTROL_HEIGHT, MARKETPLACE_COLORS } from '../theme';
import { SEARCH_DEBOUNCE_MS } from '../lib/constants';
import { Kbd } from './ui/Kbd';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ marketplace, priority });
  latest.current = { marketplace, priority };

  // Debounce the free-text field; the toggles fire immediately. Intentionally keyed on
  // `text` only; the current marketplace/priority are read via `latest.current`.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== q) onChange({ q: text, ...latest.current });
    }, SEARCH_DEBOUNCE_MS);
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
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          height: CONTROL_HEIGHT,
          px: 3.5,
          flex: '1 1 300px',
          maxWidth: hasFilters ? { md: 640 } : 'none',
          minWidth: { xs: '100%', sm: 260 },
          borderRadius: 'var(--db-radius-md)',
          border: (t) => `1px solid ${(t.vars ?? t).palette.surface.borderStrong}`,
          bgcolor: 'surface.panel',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '& .search-icon': { color: 'text.disabled', transition: 'color 120ms ease' },
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (t) =>
              `0 0 0 3px color-mix(in srgb, ${(t.vars ?? t).palette.primary.main} 16%, transparent)`,
          },
          '&:focus-within .search-icon': { color: 'primary.main' },
        }}
      >
        <SearchIcon className="search-icon" />
        <InputBase
          inputRef={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
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
            sx={{ p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        ) : (
          <Kbd sx={{ display: { xs: 'none', sm: 'inline-block' } }}>/</Kbd>
        )}
      </Box>

      {hasFilters && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            flexWrap: 'wrap',
            ml: { md: 'auto' },
          }}
        >
          {showPriority && (
            <ToggleButton
              value="priority"
              selected={priority}
              onChange={() => emit({ priority: !priority })}
              sx={{
                // Shape, size and the neutral state come from the theme; only the "this filter
                // is on" tint is specific to this toggle.
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
              <FlagRoundedIcon fontSize="small" />
              Priority
            </ToggleButton>
          )}

          {showMarketplace && (
            <ToggleButtonGroup
              exclusive
              value={marketplace || 'all'}
              onChange={(_, val) =>
                emit({ marketplace: val === 'all' || !val ? '' : (val as Marketplace) })
              }
              sx={{ maxWidth: '100%' }}
            >
              <ToggleButton value="all">All</ToggleButton>
              {MARKETPLACES.map((m) => (
                <ToggleButton key={m} value={m}>
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: MARKETPLACE_COLORS[m],
                      mr: 2,
                      boxShadow: `0 0 0 3px ${alpha(MARKETPLACE_COLORS[m], 0.13)}`,
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
