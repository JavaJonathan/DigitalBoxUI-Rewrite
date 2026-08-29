import type { Marketplace, OrderStatus, ParseStatus } from '../types';

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Compact relative time, e.g. "just now", "4m", "2h", "3d", then falls back to a date. */
export function relativeTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return value;
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

/** Shown as the tooltip on the parse-warning icon next to an order number. */
export const PARSE_STATUS_HINTS: Record<ParseStatus, string> = {
  Parsed: '',
  NeedsReview: 'Some details may be wrong — open the order and check against the slip before shipping.',
  Failed: "Couldn't read this packing slip — open the order to enter the details manually.",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  Open: 'Open',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
};

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? singular : plural}`;
}
