import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

/** Title row with a close button, shared by the upload / report / inventory dialogs. */
export function DialogHeader({
  title,
  onClose,
  disabled,
}: {
  title: ReactNode;
  onClose: () => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
      <DialogTitle>{title}</DialogTitle>
      <IconButton size="small" onClick={onClose} disabled={disabled} aria-label="Close">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
