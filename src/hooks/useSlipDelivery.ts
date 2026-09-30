import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../components/ToastProvider';
import { pluralize } from '../lib/format';
import {
  deliverSlips,
  type SlipDeliveryResult,
  type SlipRef,
  type SlipStatus,
} from '../lib/slipFolder';
import { useSlipFolder } from './useSlipFolder';

export interface SlipItem {
  fileName: string;
  status: SlipStatus;
  error?: string;
}

interface DeliveryState {
  open: boolean;
  running: boolean;
  mode: SlipDeliveryResult['mode'];
  folderName: string | null;
  note: string | null;
  items: SlipItem[];
}

const CLOSED: DeliveryState = {
  open: false,
  running: false,
  mode: 'download',
  folderName: null,
  note: null,
  items: [],
};

/**
 * Bulk "save these packing slips" into the operator's chosen folder if the browser supports
 * one and it's set, otherwise as individual downloads. Used by the ship flow and the standalone
 * "Download slips" button on both the queue and history. More than one slip opens a progress
 * dialog (`dialogProps` -> `SlipDeliveryDialog`); a single slip just toasts. `note` is a context
 * line for that dialog (e.g. the ship result), so the caller can skip its own toast.
 */
export function useSlipDelivery() {
  const { notify } = useToast();
  const folder = useSlipFolder();
  const [state, setState] = useState<DeliveryState>(CLOSED);
  const [singleBusy, setSingleBusy] = useState(false);
  const refsRef = useRef<SlipRef[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Leaving the page takes the dialog with it; stop fetching for a dialog nobody can see.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Runs the slips at `indices` (into refsRef) and streams each transition into the dialog.
  const run = useCallback(async (indices: number[], target: FileSystemDirectoryHandle | null) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const indexSet = new Set(indices);
    setState((s) => ({
      ...s,
      running: true,
      folderName: target?.name ?? null,
      items: s.items.map((it, i) =>
        indexSet.has(i) ? { fileName: it.fileName, status: 'queued' } : it,
      ),
    }));
    await deliverSlips(
      indices.map((i) => refsRef.current[i]),
      target,
      {
        signal: controller.signal,
        onMode: (mode) => setState((s) => ({ ...s, mode })),
        onUpdate: (j, status, error) =>
          setState((s) => ({
            ...s,
            items: s.items.map((it, i) => (i === indices[j] ? { ...it, status, error } : it)),
          })),
      },
    );
    setState((s) => ({ ...s, running: false }));
  }, []);

  const deliverOne = useCallback(
    async (refs: SlipRef[], target: FileSystemDirectoryHandle | null) => {
      setSingleBusy(true);
      try {
        const r = await deliverSlips(refs, target);
        if (r.delivered === 0) {
          notify('Could not download the packing slip.', 'error');
        } else {
          notify(
            r.mode === 'folder'
              ? `Saved ${pluralize(r.delivered, 'slip')} to ${target?.name ?? 'your folder'}.`
              : `Downloading ${pluralize(r.delivered, 'slip')}.`,
            'success',
          );
        }
      } finally {
        setSingleBusy(false);
      }
    },
    [notify],
  );

  const deliver = useCallback(
    async (refs: SlipRef[], promptForFolder = false, note: string | null = null) => {
      if (refs.length === 0) return;

      let target = folder.handle;
      if (promptForFolder && folder.supported && !target) {
        target = await folder.choose();
      }

      if (refs.length === 1) {
        await deliverOne(refs, target);
        return;
      }

      refsRef.current = refs;
      setState({
        open: true,
        running: true,
        mode: 'download',
        folderName: target?.name ?? null,
        note,
        items: refs.map((r) => ({ fileName: r.fileName, status: 'queued' })),
      });
      await run(
        refs.map((_, i) => i),
        target,
      );
    },
    [folder, deliverOne, run],
  );

  const retry = useCallback(
    (onlyUnfinished: boolean) => {
      // "Unfinished" = failed plus anything a Stop left queued.
      const indices = state.items
        .map((it, i) =>
          !onlyUnfinished || it.status === 'failed' || it.status === 'queued' ? i : -1,
        )
        .filter((i) => i >= 0);
      if (indices.length === 0) return;
      void run(indices, folder.handle);
    },
    [state.items, folder.handle, run],
  );

  const dialogProps = {
    open: state.open,
    running: state.running,
    mode: state.mode,
    folderName: state.folderName,
    note: state.note,
    items: state.items,
    onCancel: () => abortRef.current?.abort(),
    onClose: () => setState(CLOSED),
    onRetryFailed: () => retry(true),
    onRetryAll: () => retry(false),
  };

  return { folder, busy: singleBusy || state.running, deliver, dialogProps };
}
