import { useCallback, useState } from 'react';

const KEY = 'digitalbox_download_slips_on_ship';

/**
 * Per-browser preference: save the packing slips (to the chosen folder, or as downloads) right
 * after shipping. Defaults on — only an explicit opt-out is stored. Surfaced as a checkbox in
 * the ship confirm dialog.
 */
export function useDownloadSlipsOnShip(): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const set = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      localStorage.setItem(KEY, String(value));
    } catch {
      /* ignore — the preference just won't persist */
    }
  }, []);

  return [enabled, set];
}
