import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import type { Marketplace } from '../types';
import { MARKETPLACE_LABELS } from '../lib/format';

interface FilterBarProps {
  q: string;
  marketplace: Marketplace | '';
  showMarketplace?: boolean;
  onChange: (next: { q: string; marketplace: Marketplace | '' }) => void;
}

const MARKETPLACE_OPTIONS: (Marketplace | '')[] = ['', 'Amazon', 'Ebay', 'Walmart', 'Shopify', 'Unknown'];

export function FilterBar({ q, marketplace, showMarketplace = true, onChange }: FilterBarProps) {
  const [text, setText] = useState(q);

  // Debounce the free-text field so we don't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== q) onChange({ q: text, marketplace });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    setText(q);
  }, [q]);

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search title, order #…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ minWidth: 280 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {showMarketplace && (
        <TextField
          size="small"
          select
          label="Marketplace"
          value={marketplace}
          onChange={(e) => onChange({ q: text, marketplace: e.target.value as Marketplace | '' })}
          sx={{ minWidth: 180 }}
        >
          {MARKETPLACE_OPTIONS.map((option) => (
            <MenuItem key={option || 'all'} value={option}>
              {option === '' ? 'All marketplaces' : MARKETPLACE_LABELS[option]}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );
}
