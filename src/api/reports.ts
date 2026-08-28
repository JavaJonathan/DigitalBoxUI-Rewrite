import { apiFetch } from './client';
import type { ShippableItemsResponse } from '../types';

export interface ColumnMapping {
  skuColumn: string;
  titleColumn: string;
  qtyColumn: string;
}

export function generateShippableItemsReport(file: File, mapping: ColumnMapping) {
  const form = new FormData();
  form.append('file', file);
  form.append('skuColumn', mapping.skuColumn);
  form.append('titleColumn', mapping.titleColumn);
  form.append('qtyColumn', mapping.qtyColumn);
  return apiFetch<ShippableItemsResponse>('/api/reports/shippable-items', {
    method: 'POST',
    body: form,
    rawBody: true,
  });
}
