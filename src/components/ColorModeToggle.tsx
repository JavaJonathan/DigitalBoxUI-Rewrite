import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

/** Cycles light → dark → system. */
export function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null;

  const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
  const label =
    mode === 'system' ? 'Theme: system' : mode === 'dark' ? 'Theme: dark' : 'Theme: light';

  return (
    <Tooltip title={label} placement="top" arrow>
      <IconButton size="small" onClick={() => setMode(next)} aria-label={label}>
        {mode === 'dark' ? (
          <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
        ) : (
          <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
