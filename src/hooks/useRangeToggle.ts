import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { idsBetween, toggleInSet } from '../lib/collections';

/**
 * Row-checkbox toggle with shift+click range selection. A plain click toggles the row and makes
 * it the anchor. Shift+click gives every row between the anchor and the clicked row the clicked
 * row's new state, leaving the anchor where it was. With no anchor, or an anchor that has left
 * the page (page change, a coworker shipped it), it falls back to a plain toggle.
 */
export function useRangeToggle(
  orders: { id: string }[],
  setSelected: Dispatch<SetStateAction<Set<string>>>,
) {
  const anchor = useRef<string | null>(null);

  return (id: string, shiftKey: boolean) => {
    const range =
      shiftKey && anchor.current
        ? idsBetween(
            orders.map((o) => o.id),
            anchor.current,
            id,
          )
        : [];

    if (range.length === 0) {
      anchor.current = id;
      setSelected((prev) => toggleInSet(prev, id));
      return;
    }

    setSelected((prev) => {
      const check = !prev.has(id);
      const next = new Set(prev);
      for (const rangeId of range) {
        if (check) next.add(rangeId);
        else next.delete(rangeId);
      }
      return next;
    });
  };
}
