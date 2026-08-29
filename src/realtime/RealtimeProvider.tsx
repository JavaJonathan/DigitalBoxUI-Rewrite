import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { useAuth } from '../auth/AuthContext';
import {
  createActivityConnection,
  type ActivityEvent,
  type OnlineUser,
} from './activityConnection';
import { RealtimeContext, type RealtimeContextValue } from './RealtimeContext';

/**
 * Owns the single activity-hub connection: opens it once the user is signed in, tears it down on
 * logout, tracks the online roster, and fans `Activity` / `QueueChanged` messages out to any
 * component subscribed via `useRealtimeEvent`. Mount inside `AuthProvider`.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const selfId = user?.id;
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // event name -> listeners. A ref, so subscribing never re-renders or restarts the hub.
  const listenersRef = useRef(new Map<string, Set<(payload: unknown) => void>>());

  const emit = useCallback((name: string, payload: unknown) => {
    listenersRef.current.get(name)?.forEach((fn) => {
      try {
        fn(payload);
      } catch {
        // one bad listener must not starve the rest
      }
    });
  }, []);

  const subscribe = useCallback<RealtimeContextValue['subscribe']>((name, listener) => {
    const map = listenersRef.current;
    let set = map.get(name);
    if (!set) {
      set = new Set();
      map.set(name, set);
    }
    const fn = listener as unknown as (payload: unknown) => void;
    set.add(fn);
    return () => set.delete(fn);
  }, []);

  useEffect(() => {
    if (!user) return;

    const connection = createActivityConnection();
    let disposed = false;

    connection.on('Presence', (online: OnlineUser[]) => {
      setOnlineUsers(Array.isArray(online) ? online : []);
    });
    connection.on('Activity', (evt: ActivityEvent) => {
      // The actor already got a success toast for their own action — don't echo it back.
      if (evt.actorUserId && evt.actorUserId === selfId) return;
      emit('activity', evt);
    });
    connection.on('QueueChanged', () => emit('queueChanged', undefined));

    const connect = async () => {
      while (!disposed && connection.state === HubConnectionState.Disconnected) {
        try {
          await connection.start();
          return;
        } catch {
          if (disposed) return;
          await new Promise((resolve) => setTimeout(resolve, 3_000));
        }
      }
    };
    const running = connect();

    return () => {
      disposed = true;
      setOnlineUsers([]);
      // Never call stop() while start() is still negotiating (that throws) — wait it out.
      void running.then(() => connection.stop()).catch(() => {});
    };
  }, [user, selfId, emit]);

  const value = useMemo<RealtimeContextValue>(
    () => ({ onlineUsers, subscribe }),
    [onlineUsers, subscribe],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
