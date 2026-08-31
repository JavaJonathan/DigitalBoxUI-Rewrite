import { useCallback, useEffect, useState } from 'react';
import {
  chooseSlipFolder,
  folderPickerSupported,
  forgetSlipFolder,
  getSlipFolder,
} from '../lib/slipFolder';

/**
 * The folder packing slips are saved into on ship (File System Access API). `handle` is null
 * when none is set or the browser can't do this — callers then fall back to plain downloads.
 */
export function useSlipFolder() {
  const supported = folderPickerSupported();
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    let live = true;
    getSlipFolder().then((h) => {
      if (live) setHandle(h);
    });
    return () => {
      live = false;
    };
  }, []);

  const choose = useCallback(async () => {
    const h = await chooseSlipFolder();
    if (h) setHandle(h);
    return h;
  }, []);

  const forget = useCallback(async () => {
    await forgetSlipFolder();
    setHandle(null);
  }, []);

  return { supported, handle, name: handle?.name ?? null, choose, forget };
}
