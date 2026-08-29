import { createContext, useContext, useEffect, useRef } from 'react';
import type { ActivityEvent, OnlineUser } from './activityConnection';

export interface RealtimeEventMap {
  activity: ActivityEvent;
  queueChanged: void;
}

export type RealtimeListener<K extends keyof RealtimeEventMap> = (
  payload: RealtimeEventMap[K],
) => void;

export interface RealtimeContextValue {
  onlineUsers: OnlineUser[];
  subscribe: <K extends keyof RealtimeEventMap>(
    name: K,
    listener: RealtimeListener<K>,
  ) => () => void;
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within a RealtimeProvider');
  return ctx;
}

/** Everyone with a live hub connection right now (includes the current user). */
export function useOnlineUsers(): OnlineUser[] {
  return useRealtime().onlineUsers;
}

/**
 * Run `handler` whenever the named hub event fires. The handler is kept in a ref (updated in an
 * effect), so callers don't need to memoise it; the subscription only re-binds if `name` changes.
 */
export function useRealtimeEvent<K extends keyof RealtimeEventMap>(
  name: K,
  handler: RealtimeListener<K>,
) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => subscribe(name, (payload) => handlerRef.current(payload)), [name, subscribe]);
}
