import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { apiUrl, TOKEN_KEY } from '../api/client';

/** Shape of an `Activity` message from the hub (mirrors the server's `ActivityEvent` record). */
export interface ActivityEvent {
  id: string;
  actorUserId: string;
  actorName: string;
  /** shipped | cancelled | reopened | uploaded */
  verb: string;
  count: number;
  at: string;
}

/** Shape of one entry in a `Presence` message (mirrors the server's `OnlineUser` record). */
export interface OnlineUser {
  userId: string;
  displayName: string;
}

/**
 * Build (but do not start) the single activity-hub connection. The JWT can't ride an
 * `Authorization` header on the WebSocket handshake, so SignalR appends it as `?access_token=`
 * and the API's `OnMessageReceived` hook reads it for `/hub` paths.
 */
export function createActivityConnection(): HubConnection {
  return (
    new HubConnectionBuilder()
      .withUrl(apiUrl('/hub/activity'), {
        accessTokenFactory: () => localStorage.getItem(TOKEN_KEY) ?? '',
        // Skip SSE/long-polling: warehouse machines are on a modern browser + LAN, and
        // WebSocket-only keeps the CORS surface (and reconnect behaviour) simple.
        transport: HttpTransportType.WebSockets,
      })
      // Retry forever — a warehouse screen left open overnight should reconnect on its own.
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => (ctx.previousRetryCount < 5 ? 2_000 : 15_000),
      })
      .configureLogging(LogLevel.Warning)
      .build()
  );
}
