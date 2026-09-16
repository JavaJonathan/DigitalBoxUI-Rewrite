import { apiFetch } from './client';
import type { ShippableOrdersResponse, ShippableItemsResponse } from '../types';

export interface ColumnMapping {
  skuColumn: string;
  titleColumn: string;
  qtyColumn: string;
}

function buildInventoryForm(file: File, mapping: ColumnMapping) {
  const form = new FormData();
  form.append('file', file);
  form.append('skuColumn', mapping.skuColumn);
  form.append('titleColumn', mapping.titleColumn);
  form.append('qtyColumn', mapping.qtyColumn);
  return form;
}

export function generateShippableOrdersReport(file: File, mapping: ColumnMapping) {
  return apiFetch<ShippableOrdersResponse>('/api/reports/shippable-orders', {
    method: 'POST',
    body: buildInventoryForm(file, mapping),
    rawBody: true,
  });
}

export function generateShippableItemsReport(file: File, mapping: ColumnMapping) {
  return apiFetch<ShippableItemsResponse>('/api/reports/shippable-items', {
    method: 'POST',
    body: buildInventoryForm(file, mapping),
    rawBody: true,
  });
}
