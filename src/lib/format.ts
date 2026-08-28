import type { Marketplace, ParseStatus } from '../types';

export function formatDate(value: string | null): string {
  if (!value) return '—';
  // Accept both "yyyy-MM-dd" (DateOnly) and full ISO timestamps.
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  Amazon: 'Amazon',
  Ebay: 'eBay',
  Walmart: 'Walmart',
  Shopify: 'Shopify',
  Unknown: 'Unknown',
};

export const PARSE_STATUS_LABELS: Record<ParseStatus, string> = {
  Parsed: 'Parsed',
  NeedsReview: 'Needs review',
  Failed: 'Parse failed',
};

export function parseStatusColor(status: ParseStatus): 'default' | 'warning' | 'error' {
  switch (status) {
    case 'NeedsReview':
      return 'warning';
    case 'Failed':
      return 'error';
    default:
      return 'default';
  }
}
