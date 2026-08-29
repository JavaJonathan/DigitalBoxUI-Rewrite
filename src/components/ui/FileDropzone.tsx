import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import Box from '@mui/material/Box';

interface FileDropzoneProps {
  /** `accept` attribute for the hidden file input, e.g. `"application/pdf,.pdf"`. */
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Called with the raw FileList on drop or pick; the caller does its own validation. */
  onFiles: (files: FileList) => void;
  /** The icon + copy shown inside the dashed area. */
  children: ReactNode;
}

/** Dashed drag-and-drop area with a hidden file input; click anywhere to browse. */
export function FileDropzone({
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  children,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const emit = (list: FileList | null) => {
    if (list && list.length > 0) onFiles(list);
  };

  return (
    <Box
      onDragOver={
        disabled
          ? undefined
          : (e: DragEvent) => {
              e.preventDefault();
              setDragging(true);
            }
      }
      onDragLeave={() => setDragging(false)}
      onDrop={
        disabled
          ? undefined
          : (e: DragEvent) => {
              e.preventDefault();
              setDragging(false);
              emit(e.dataTransfer.files);
            }
      }
      onClick={disabled ? undefined : () => inputRef.current?.click()}
      sx={{
        border: '1.5px dashed',
        borderColor: dragging ? 'primary.main' : 'surface.borderStrong',
        borderRadius: 2.5,
        px: 3,
        py: 4,
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        bgcolor: dragging ? 'primary.light' : 'surface.inset',
        transition: 'border-color 120ms ease, background-color 120ms ease',
      }}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => emit(e.target.files)}
      />
    </Box>
  );
}
