import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import type { SxProps, Theme } from '@mui/material/styles';

interface PriorityToggleProps {
  isPriority: boolean;
  onToggle: () => void;
  iconSize?: number;
  /** merged onto the IconButton (the table passes its hover-reveal transition here) */
  sx?: SxProps<Theme>;
  className?: string;
}

/** Flag icon button that toggles an order's priority. Tooltip + aria label handled here. */
export function PriorityToggle({
  isPriority,
  onToggle,
  iconSize = 16,
  sx,
  className,
}: PriorityToggleProps) {
  const label = isPriority ? 'Remove priority' : 'Mark priority';
  return (
    <Tooltip title={label} arrow>
      <IconButton
        size="small"
        onClick={onToggle}
        aria-label={label}
        className={className}
        sx={{ color: isPriority ? 'primary.main' : 'text.disabled', ...sx }}
      >
        {isPriority ? (
          <FlagRoundedIcon sx={{ fontSize: iconSize }} />
        ) : (
          <OutlinedFlagIcon sx={{ fontSize: iconSize }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
