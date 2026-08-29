import { useCallback, useEffect, useState } from 'react';
import { listOrders } from '../api/orders';
import { getApiErrorMessage } from '../api/client';
import type { OrderListItem, OrderQuery, PagedResult } from '../types';

interface UseOrdersResult {
  data: PagedResult<OrderListItem> | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrders(query: OrderQuery): UseOrdersResult {
  const [data, setData] = useState<PagedResult<OrderListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Bumping `nonce` is how `refresh()` forces a re-fetch without changing the query.
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Serialise the query so the effect below has a stable primitive dependency even if the
  // caller passes a fresh object each render.
  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listOrders(query)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load orders.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `query` is intentionally omitted from the deps — `key` is its serialised form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  return { data, loading, error, refresh };
}
