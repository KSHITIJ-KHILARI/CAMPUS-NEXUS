import { WS_BASE_URL } from "@/lib/constants";

export type WebSocketEventType =
  | "crowd_update"
  | "lift_update"
  | "notification"
  | "issue_update"
  | "event_update"
  | "schedule_update"
  | "digital_twin_update"
  | "simulation_update"
  | "chat_message"
  | "system"
  | "connect"
  | "disconnect"
  | "error"
  | "pong";

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: string;
}

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

type EventListeners = Map<WebSocketEventType, Set<WebSocketEventHandler>>;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxRetries: number = 5;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private listeners: EventListeners = new Map();
  private messageQueue: WebSocketEvent[] = [];
  private isConnected: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(url: string = WS_BASE_URL) {
    this.url = url;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrl = this.url.startsWith("wss://") || this.url.startsWith("ws://")
        ? this.url
        : `wss://${this.url}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send authentication message first
        const token = localStorage.getItem("auth_token");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ token: token || null }));
        }

        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit({ type: "connect", payload: {}, timestamp: new Date().toISOString() });
        this.processQueue();
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          this.emit(data);
        } catch {
          this.emit({
            type: "error",
            payload: { raw: event.data },
            timestamp: new Date().toISOString(),
          });
        }
      };

      this.ws.onerror = (error) => {
        this.emit({
          type: "error",
          payload: { error: "WebSocket connection error" },
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopPing();
        this.emit({ type: "disconnect", payload: {}, timestamp: new Date().toISOString() });
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.emit({
        type: "error",
        payload: { error: String(error) },
        timestamp: new Date().toISOString(),
      });
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  subscribe(type: WebSocketEventType, handler: WebSocketEventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type: WebSocketEventType, handler: WebSocketEventHandler): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(type: WebSocketEventType, payload: unknown): void {
    const event: WebSocketEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      this.messageQueue.push(event);
    }
  }

  emit(event: WebSocketEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  private processQueue(): void {
    while (this.messageQueue.length > 0) {
      const event = this.messageQueue.shift();
      if (event && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxRetries) {
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send("pong", { time: Date.now() });
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const wsClient = new WebSocketClient();

export default WebSocketClient;
