import { useCallback, useEffect, useRef, useState } from 'react';
import { listOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import type { OrderListItem, OrderQuery, PagedResult } from '../types';

interface RefreshOptions {
  /**
   * Re-fetch without the skeleton: `loading` stays put and the current list is swapped in place
   * when the response lands. Used for realtime nudges so a coworker's ship/cancel doesn't yank
   * the user back to the top of the list.
   */
  background?: boolean;
}

interface UseOrdersResult {
  data: PagedResult<OrderListItem> | null;
  loading: boolean;
  error: string | null;
  refresh: (opts?: RefreshOptions) => void;
}

export function useOrders(query: OrderQuery): UseOrdersResult {
  const [data, setData] = useState<PagedResult<OrderListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Set by `refresh({ background: true })`, consumed (and reset) by the effect below.
  const backgroundRef = useRef(false);

  // Bumping `nonce` is how `refresh()` forces a re-fetch without changing the query.
  const refresh = useCallback((opts?: RefreshOptions) => {
    if (opts?.background) backgroundRef.current = true;
    setNonce((n) => n + 1);
  }, []);

  // Serialise the query so the effect below has a stable primitive dependency even if the
  // caller passes a fresh object each render.
  const key = JSON.stringify(query);
  const keyRef = useRef(key);

  useEffect(() => {
    // A query change (filter / search / page) always shows the skeleton; only a same-query
    // refresh can be silent.
    const background = backgroundRef.current && keyRef.current === key;
    backgroundRef.current = false;
    keyRef.current = key;

    let cancelled = false;
    if (!background) {
      setLoading(true);
      setError(null);
    }

    listOrders(query)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        // A failed background poll keeps the current list on screen rather than flashing an error.
        if (!cancelled && !background) setError(getApiErrorMessage(err, 'Could not load orders.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `query` is intentionally omitted from the deps; `key` is its serialised form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  return { data, loading, error, refresh };
}
