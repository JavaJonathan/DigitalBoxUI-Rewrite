/** Return a new Set with `value` removed if present, otherwise added. */
export function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** The values from `a` to `b` inclusive, in list order whichever comes first; `[]` if either is absent. */
export function idsBetween<T>(items: T[], a: T, b: T): T[] {
  const from = items.indexOf(a);
  const to = items.indexOf(b);
  if (from < 0 || to < 0) return [];
  return items.slice(Math.min(from, to), Math.max(from, to) + 1);
}
