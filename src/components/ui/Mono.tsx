import { useState } from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import type { SxProps, Theme } from '@mui/material/styles';

interface MonoProps {
  children: string;
  /** Show a copy affordance on hover and copy on click. */
  copyable?: boolean;
  muted?: boolean;
  sx?: SxProps<Theme>;
}

/** Monospaced technical text — order numbers, SKUs, IDs. */
export function Mono({ children, copyable = false, muted = false, sx }: MonoProps) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const node = (
    <Box
      component="span"
      className="db-mono"
      onClick={copyable ? copy : undefined}
      sx={{
        fontSize: '0.8125rem',
        color: muted ? 'text.secondary' : 'text.primary',
        cursor: copyable ? 'pointer' : 'inherit',
        borderRadius: 1,
        px: copyable ? 0.5 : 0,
        mx: copyable ? -0.5 : 0,
        transition: 'background-color 100ms ease',
        '&:hover': copyable ? { bgcolor: 'action.hover' } : undefined,
        ...sx,
      }}
    >
      {children}
    </Box>
  );

  if (!copyable) return node;

  return (
    <Tooltip title={copied ? 'Copied' : 'Click to copy'} placement="top" arrow>
      {node}
    </Tooltip>
  );
}
