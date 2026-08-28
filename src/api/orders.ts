import { apiFetch, apiUrl, ApiError, TOKEN_KEY } from './client';
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
  params.set('pageSize', String(query.pageSize ?? 50));
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

export function undoOrders(orderIds: string[], actionedBy: string) {
  return apiFetch<ActionResult>('/api/orders/undo', {
    method: 'POST',
    body: JSON.stringify({ orderIds, actionedBy }),
  });
}

export function updateOrder(id: string, payload: UpdateOrderPayload) {
  return apiFetch<OrderDetail>(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function uploadPackingSlips(files: File[]) {
  const form = new FormData();
  for (const file of files) {
    form.append('files', file);
  }
  return apiFetch<UploadResponse>('/api/orders/upload', {
    method: 'POST',
    body: form,
    rawBody: true,
  });
}

export function shipOrders(orderIds: string[], actionedBy: string) {
  return apiFetch<ActionResult>('/api/orders/ship', {
    method: 'POST',
    body: JSON.stringify({ orderIds, actionedBy }),
  });
}

export function cancelOrders(orderIds: string[], actionedBy: string) {
  return apiFetch<ActionResult>('/api/orders/cancel', {
    method: 'POST',
    body: JSON.stringify({ orderIds, actionedBy }),
  });
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
