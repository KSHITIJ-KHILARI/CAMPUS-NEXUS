import { useEffect, useState, useCallback, useRef } from "react";
import { wsClient, WebSocketEvent, WebSocketEventType, WebSocketEventHandler } from "@/lib/websocket";

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
}

export function useWebSocket(
  options: UseWebSocketOptions = { autoConnect: true, reconnect: true }
) {
  const [data, setData] = useState<WebSocketEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options.autoConnect) {
      wsClient.connect();
    }

    const handleConnect: WebSocketEventHandler = () => {
      setConnected(true);
      setError(null);
    };

    const handleDisconnect: WebSocketEventHandler = () => {
      setConnected(false);
    };

    const handleError: WebSocketEventHandler = (event) => {
      setError((event.payload as { error?: string })?.error ?? "WebSocket error");
    };

    const handleMessage: WebSocketEventHandler = (event) => {
      setData(event);
    };

    wsClient.subscribe("connect", handleConnect);
    wsClient.subscribe("disconnect", handleDisconnect);
    wsClient.subscribe("error", handleError);

    const eventTypes: WebSocketEventType[] = [
      "crowd_update",
      "lift_update",
      "notification",
      "issue_update",
      "event_update",
      "schedule_update",
      "digital_twin_update",
      "simulation_update",
      "chat_message",
      "system",
    ];

    const handlers = new Map<WebSocketEventType, WebSocketEventHandler>();
    eventTypes.forEach((type) => {
      const handler: WebSocketEventHandler = (event) => {
        setData(event);
      };
      handlers.set(type, handler);
      wsClient.subscribe(type, handler);
    });

    return () => {
      wsClient.unsubscribe("connect", handleConnect);
      wsClient.unsubscribe("disconnect", handleDisconnect);
      wsClient.unsubscribe("error", handleError);
      eventTypes.forEach((type) => {
        wsClient.unsubscribe(type, handlers.get(type)!);
      });

      if (!options.reconnect) {
        wsClient.disconnect();
      }
    };
  }, [options.autoConnect, options.reconnect]);

  const subscribe = useCallback(
    (type: WebSocketEventType, handler: WebSocketEventHandler) => {
      wsClient.subscribe(type, handler);
      return () => wsClient.unsubscribe(type, handler);
    },
    []
  );

  const send = useCallback((type: WebSocketEventType, payload: unknown) => {
    wsClient.send(type, payload);
  }, []);

  return { data, connected, error, subscribe, send };
}
