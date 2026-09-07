import { apiFetch } from './client';
import type { InventoryKind, InventoryStatus, LookupResult } from '../types';

export function lookupOrder(orderNumber: string) {
  const params = new URLSearchParams({ orderNumber });
  return apiFetch<LookupResult>(`/api/lookup/order?${params.toString()}`);
}

export function getInventoryStatus() {
  return apiFetch<InventoryStatus>('/api/lookup/inventory');
}

export interface InventoryColumnMapping {
  skuColumn: string;
  titleColumn?: string;
  qtyColumn?: string;
}

export function uploadInventory(kind: InventoryKind, file: File, mapping: InventoryColumnMapping) {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  form.append('skuColumn', mapping.skuColumn);
  if (mapping.titleColumn) form.append('titleColumn', mapping.titleColumn);
  if (mapping.qtyColumn) form.append('qtyColumn', mapping.qtyColumn);
  return apiFetch<InventoryStatus>('/api/lookup/inventory', {
    method: 'POST',
    body: form,
    rawBody: true,
  });
}
