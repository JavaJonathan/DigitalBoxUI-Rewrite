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

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  return { data, loading, error, refresh };
}
