import { fetchPackingSlipBlob } from '../api/orders';
import { downloadBlob } from './download';
import type { Marketplace } from '../types';

/**
 * "Where do the packing slips go when I ship?" — the rewrite's answer to the old app's
 * `botConfigs.json` `DownloadFolderPath`. When the browser supports the File System Access API
 * (Chrome/Edge) the operator picks a folder once; every ship then writes the PDFs straight into
 * it. Everywhere else we fall back to individual downloads into the browser's Downloads folder.
 */

// --- the remembered directory handle (one, in IndexedDB — handles aren't localStorage-safe) ---

const DB_NAME = 'digitalbox';
const STORE = 'handles';
const KEY = 'slipFolder';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRun<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = run(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export function folderPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function getSlipFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!folderPickerSupported()) return null;
  try {
    return (
      (await idbRun<FileSystemDirectoryHandle | undefined>('readonly', (s) => s.get(KEY))) ?? null
    );
  } catch {
    return null;
  }
}

export async function chooseSlipFolder(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await window.showDirectoryPicker({ id: 'digitalbox-slips', mode: 'readwrite' });
    await idbRun('readwrite', (s) => s.put(handle, KEY)).catch(() => {});
    return handle;
  } catch {
    // The operator dismissed the picker (AbortError) — leave the current folder as-is.
    return null;
  }
}

export async function forgetSlipFolder(): Promise<void> {
  await idbRun('readwrite', (s) => s.delete(KEY)).catch(() => {});
}

async function canWrite(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    return (await handle.requestPermission(opts)) === 'granted';
  } catch {
    // requestPermission throws without a live user gesture — treat as "not now".
    return false;
  }
}

// --- filenames: "<marketplace>-<order number>.pdf", de-duplicated within one batch ---

export interface SlipRef {
  orderId: string;
  fileName: string;
}

export function slipFileName(marketplace: Marketplace, orderNumber: string): string {
  const slug =
    [...(orderNumber ?? '')]
      .map((c) => (/[a-z0-9_-]/i.test(c) ? c : '-'))
      .join('')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'order';
  return `${marketplace.toLowerCase()}-${slug}.pdf`;
}

export function buildSlipRefs(
  orderIds: string[],
  lookup: (id: string) => { orderNumber: string; marketplace: Marketplace } | undefined,
): SlipRef[] {
  const used = new Set<string>();
  return orderIds.map((orderId) => {
    const order = lookup(orderId);
    let name = order
      ? slipFileName(order.marketplace, order.orderNumber)
      : `slip-${orderId.slice(0, 8)}.pdf`;
    for (let n = 2; used.has(name.toLowerCase()); n++) {
      name = name.replace(/\.pdf$/i, `-${n}.pdf`);
    }
    used.add(name.toLowerCase());
    return { orderId, fileName: name };
  });
}

// --- delivery ---

export interface SlipDeliveryResult {
  mode: 'folder' | 'download';
  total: number;
  delivered: number;
  failed: number;
}

/**
 * Fetch each slip and either write it into the chosen folder or hand it to the browser as a
 * download. `folder` is the handle from `useSlipFolder`; pass null to force the download path.
 */
export async function deliverSlips(
  slips: SlipRef[],
  folder: FileSystemDirectoryHandle | null,
): Promise<SlipDeliveryResult> {
  const useFolder = folder !== null && (await canWrite(folder));
  const result: SlipDeliveryResult = {
    mode: useFolder ? 'folder' : 'download',
    total: slips.length,
    delivered: 0,
    failed: 0,
  };

  for (const slip of slips) {
    try {
      const blob = await fetchPackingSlipBlob(slip.orderId);
      if (useFolder && folder) {
        const fileHandle = await folder.getFileHandle(slip.fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        downloadBlob(slip.fileName, blob);
      }
      result.delivered++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
