import { apiFetch, apiUrl, ApiError, TOKEN_KEY, getApiErrorMessage } from './client';
import { PAGE_SIZE } from '../lib/constants';
import type {
  ActionResult,
  OrderDetail,
  OrderListItem,
  OrderQuery,
  PagedResult,
  UpdateOrderPayload,
  UploadResponse,
} from '../types';

export function listOrders(query: OrderQuery) {
  const params = new URLSearchParams();
  params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.marketplace) params.set('marketplace', query.marketplace);
  if (query.priority) params.set('priority', 'true');
  if (query.sort) params.set('sort', query.sort);
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? PAGE_SIZE));
  return apiFetch<PagedResult<OrderListItem>>(`/api/orders?${params.toString()}`);
}

export function getOrder(id: string) {
  return apiFetch<OrderDetail>(`/api/orders/${id}`);
}

export function setOrderPriority(id: string, isPriority: boolean) {
  return apiFetch<OrderDetail>(`/api/orders/${id}/priority`, {
    method: 'POST',
    body: JSON.stringify({ isPriority }),
  });
}

export function setOrderNotes(id: string, notes: string | null) {
  return apiFetch<OrderDetail>(`/api/orders/${id}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes }),
  });
}

export function undoOrders(orderIds: string[]) {
  return apiFetch<ActionResult>('/api/orders/undo', {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export function updateOrder(id: string, payload: UpdateOrderPayload) {
  return apiFetch<OrderDetail>(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Files per request. Small enough that each batch stays quick and well under the API's 100 MB
 * cap even if every file is at the 15 MB limit; large enough to keep the request count low.
 * Progress is reported at this granularity.
 */
const UPLOAD_CHUNK_SIZE = 6;

/**
 * Upload packing slips in sequential batches rather than one large request. Each batch commits
 * its own orders server-side (and re-uploads are deduped by hash), so a failed batch doesn't
 * lose the ones before it — its files are just reported as errors and the rest continue.
 * A single "someone uploaded N orders" popup is broadcast at the end, not one per batch.
 */
export async function uploadPackingSlips(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<UploadResponse> {
  const merged: UploadResponse = { created: 0, duplicates: 0, errors: 0, files: [] };

  for (let start = 0; start < files.length; start += UPLOAD_CHUNK_SIZE) {
    const batch = files.slice(start, start + UPLOAD_CHUNK_SIZE);
    const form = new FormData();
    for (const file of batch) form.append('files', file);
    // Hold the activity popup — we fire one summary broadcast once every batch is in.
    form.append('announce', 'false');

    try {
      const result = await apiFetch<UploadResponse>('/api/orders/upload', {
        method: 'POST',
        body: form,
        rawBody: true,
      });
      merged.created += result.created;
      merged.duplicates += result.duplicates;
      merged.errors += result.errors;
      merged.files.push(...result.files);
    } catch (err) {
      // A stale token won't recover on the next batch — stop and let the caller sign out.
      if (err instanceof ApiError && err.status === 401) throw err;
      merged.errors += batch.length;
      merged.files.push(
        ...batch.map((f) => ({
          fileName: f.name,
          outcome: 'error' as const,
          orderId: null,
          orderNumber: null,
          parseStatus: null,
          message: getApiErrorMessage(err, 'This batch failed to upload.'),
        })),
      );
    }

    onProgress?.(Math.min(start + UPLOAD_CHUNK_SIZE, files.length), files.length);
  }

  if (merged.created > 0) {
    // Best-effort: the orders are already saved; a failed announce just means no popup.
    try {
      await apiFetch<void>('/api/orders/upload/announce', {
        method: 'POST',
        body: JSON.stringify({ created: merged.created }),
      });
    } catch {
      /* ignore */
    }
  }

  return merged;
}

export function shipOrders(orderIds: string[]) {
  return apiFetch<ActionResult>('/api/orders/ship', {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

export function cancelOrders(orderIds: string[]) {
  return apiFetch<ActionResult>('/api/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ orderIds }),
  });
}

/**
 * Fetch one order's packing slip as a blob, with the bearer token (the endpoint is auth-gated,
 * so a plain link can't load it). Used by the bulk "download slips" / save-to-folder flow.
 */
export async function fetchPackingSlipBlob(orderId: string): Promise<Blob> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(apiUrl(`/api/orders/${orderId}/packing-slip`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load a packing slip.');
  }
  return response.blob();
}

/**
 * The packing-slip endpoint is auth-gated, so a plain link can't load it. Fetch the PDF with
 * the bearer token and hand back an object URL the caller is responsible for revoking.
 */
export async function fetchPackingSlipObjectUrl(orderId: string): Promise<string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(apiUrl(`/api/orders/${orderId}/packing-slip`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new ApiError(response.status, 'Could not load the packing slip.');
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
