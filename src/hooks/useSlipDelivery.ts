import { useCallback, useState } from 'react';
import { useToast } from '../components/ToastProvider';
import { pluralize } from '../lib/format';
import { deliverSlips, type SlipRef } from '../lib/slipFolder';
import { useSlipFolder } from './useSlipFolder';

/**
 * Bulk "save these packing slips" — into the operator's chosen folder if the browser supports
 * one and it's set, otherwise as individual downloads. Used by the ship flow and the standalone
 * "Download slips" button on both the queue and history.
 */
export function useSlipDelivery() {
  const { notify } = useToast();
  const folder = useSlipFolder();
  const [busy, setBusy] = useState(false);

  const deliver = useCallback(
    async (refs: SlipRef[], promptForFolder = false) => {
      if (refs.length === 0) return;

      let target = folder.handle;
      if (promptForFolder && folder.supported && !target) {
        target = await folder.choose();
      }

      setBusy(true);
      try {
        const r = await deliverSlips(refs, target);
        if (r.delivered === 0) {
          notify('Could not download the packing slips.', 'error');
        } else if (r.failed > 0) {
          notify(`${pluralize(r.delivered, 'slip')} delivered; ${r.failed} failed.`, 'warning');
        } else {
          notify(
            r.mode === 'folder'
              ? `Saved ${pluralize(r.delivered, 'slip')} to ${target?.name ?? 'your folder'}.`
              : `Downloading ${pluralize(r.delivered, 'slip')}.`,
            'success',
          );
        }
      } finally {
        setBusy(false);
      }
    },
    [folder, notify],
  );

  return { folder, busy, deliver };
}
