import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';

interface SlipFolderFieldProps {
  supported: boolean;
  name: string | null;
  onChoose: () => void;
  onForget: () => void;
}

/** The "where do shipped slips go" line under the ship dialog's download toggle. */
export function SlipFolderField({ supported, name, onChoose, onForget }: SlipFolderFieldProps) {
  if (!supported) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', pl: 3.5 }}>
        Slips download to your browser's Downloads folder.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        pl: 3.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        flexWrap: 'wrap',
        color: 'text.secondary',
      }}
    >
      <FolderOutlinedIcon sx={{ fontSize: 14 }} />
      {name ? (
        <Typography variant="caption" sx={{ color: 'inherit' }}>
          Saving to <strong>{name}</strong>
          {' · '}
          <Link component="button" type="button" underline="hover" onClick={onChoose}>
            Change
          </Link>
          {' · '}
          <Link component="button" type="button" underline="hover" onClick={onForget}>
            Use Downloads
          </Link>
        </Typography>
      ) : (
        <Link component="button" type="button" underline="hover" onClick={onChoose}>
          <Typography variant="caption" sx={{ color: 'inherit' }}>
            Choose a folder to save slips into…
          </Typography>
        </Link>
      )}
    </Box>
  );
}
