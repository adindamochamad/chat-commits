import WebSocket, { type RawData } from "ws";
import type { ChatMessage } from "./chat-commands.js";

const EVENTSUB_URL = "wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30";
const HELIX_SUBSCRIPTIONS_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

export interface EventSubConfig {
  clientId: string;
  userAccessToken: string;
  broadcasterId: string;
  botUserId: string;
}

interface EventSubEnvelope {
  metadata?: { message_id?: string; message_type?: string; subscription_type?: string };
  payload?: {
    session?: { id?: string; keepalive_timeout_seconds?: number; reconnect_url?: string | null };
    event?: {
      message_id?: string;
      chatter_user_id?: string;
      chatter_user_name?: string;
      chatter_user_login?: string;
      message?: { text?: string };
    };
  };
}

export class EventSubClient {
  private activeSocket?: WebSocket;
  private migrationSocket?: WebSocket;
  private reconnectTimer?: NodeJS.Timeout;
  private keepaliveTimer?: NodeJS.Timeout;
  private reconnectAttempt = 0;
  private keepaliveTimeoutSeconds = 30;
  private stopped = true;
  private readonly seenMessageIds = new Set<string>();
  private readonly seenMessageOrder: string[] = [];

  constructor(
    private readonly config: EventSubConfig,
    private readonly onChatMessage: (message: ChatMessage) => void,
    private readonly log: (message: string, error?: unknown) => void = console.info,
  ) {}

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.openSocket(EVENTSUB_URL, false);
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.keepaliveTimer);
    this.reconnectTimer = undefined;
    this.keepaliveTimer = undefined;
    this.migrationSocket?.close(1000, "server stopping");
    this.activeSocket?.close(1000, "server stopping");
    this.migrationSocket = undefined;
    this.activeSocket = undefined;
  }

  private openSocket(url: string, migration: boolean): void {
    if (this.stopped) return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      this.log("Unable to create EventSub WebSocket", error);
      this.scheduleReconnect();
      return;
    }
    if (migration) this.migrationSocket = socket;
    else this.activeSocket = socket;

    socket.on("message", (data: RawData) => {
      void this.handleFrame(socket, data.toString(), migration);
    });
    socket.on("error", (error) => this.log("EventSub WebSocket error", error));
    socket.on("close", (code, reason) => {
      if (this.stopped) return;
      const wasActive = this.activeSocket === socket;
      const wasMigration = this.migrationSocket === socket;
      if (wasActive) this.activeSocket = undefined;
      if (wasMigration) this.migrationSocket = undefined;
      if (wasActive || wasMigration) {
        this.log(`EventSub WebSocket closed (${code}: ${reason.toString()})`);
        this.scheduleReconnect();
      }
    });
  }

  private async handleFrame(socket: WebSocket, frame: string, migration: boolean): Promise<void> {
    let message: EventSubEnvelope;
    try {
      message = JSON.parse(frame) as EventSubEnvelope;
    } catch {
      this.log("Ignoring malformed EventSub frame");
      return;
    }
    const type = message.metadata?.message_type;
    if (type === "session_welcome") {
      const session = message.payload?.session;
      if (!session?.id) {
        this.log("EventSub welcome did not include a session ID");
        socket.close(1011, "missing session ID");
        return;
      }
      const previousSocket = migration ? this.activeSocket : undefined;
      this.activeSocket = socket;
      if (this.migrationSocket === socket) this.migrationSocket = undefined;
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
      this.reconnectAttempt = 0;
      this.keepaliveTimeoutSeconds = session.keepalive_timeout_seconds ?? 30;
      this.armKeepalive(this.keepaliveTimeoutSeconds, socket);
      this.log(`EventSub connected (session ${session.id})`);
      if (migration) {
        previousSocket?.close(1000, "EventSub session migrated");
      } else {
        try {
          await this.subscribeToChat(session.id);
        } catch (error) {
          this.log("Could not subscribe to channel.chat.message", error);
          socket.close(1011, "subscription failed");
        }
      }
      return;
    }

    if (type === "session_reconnect") {
      const reconnectUrl = message.payload?.session?.reconnect_url;
      if (!reconnectUrl) {
        this.log("EventSub requested reconnect without a reconnect URL");
        socket.close(1011, "missing reconnect URL");
      } else {
        this.log("EventSub requested a session migration");
        this.openSocket(reconnectUrl, true);
      }
      return;
    }

    if (type === "session_keepalive") {
      if (socket === this.activeSocket) this.armKeepalive(this.keepaliveTimeoutSeconds, socket);
      return;
    }
    if (type === "revocation") {
      this.log("Twitch revoked an EventSub subscription", message.payload);
      return;
    }
    if (type !== "notification" || socket !== this.activeSocket) return;

    this.armKeepalive(this.keepaliveTimeoutSeconds, socket);
    if (message.metadata?.subscription_type !== "channel.chat.message") return;
    const event = message.payload?.event;
    const messageId = event?.message_id ?? message.metadata.message_id;
    const chatterId = event?.chatter_user_id;
    const text = event?.message?.text;
    if (!messageId || !chatterId || typeof text !== "string") return;
    if (this.seenMessageIds.has(messageId)) return;
    this.rememberMessageId(messageId);
    this.onChatMessage({
      messageId,
      chatterId,
      chatterName: event?.chatter_user_name ?? event?.chatter_user_login ?? chatterId,
      text,
    });
  }

  private async subscribeToChat(sessionId: string): Promise<void> {
    const response = await fetch(HELIX_SUBSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.userAccessToken}`,
        "Client-Id": this.config.clientId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "channel.chat.message",
        version: "1",
        condition: {
          broadcaster_user_id: this.config.broadcasterId,
          user_id: this.config.botUserId,
        },
        transport: { method: "websocket", session_id: sessionId },
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Helix returned ${response.status}: ${details}`);
    }
    this.log("Subscribed to channel.chat.message");
  }

  private armKeepalive(seconds: number, socket: WebSocket): void {
    clearTimeout(this.keepaliveTimer);
    this.keepaliveTimer = setTimeout(() => {
      if (socket === this.activeSocket) {
        this.log("EventSub keepalive timed out; reconnecting");
        socket.terminate();
      }
    }, seconds * 1000);
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer) return;
    clearTimeout(this.keepaliveTimer);
    this.keepaliveTimer = undefined;
    const delayMs = Math.min(1_000 * 2 ** this.reconnectAttempt, 30_000);
    this.reconnectAttempt += 1;
    this.log(`Reconnecting to EventSub in ${delayMs}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.openSocket(EVENTSUB_URL, false);
    }, delayMs);
  }

  private rememberMessageId(id: string): void {
    this.seenMessageIds.add(id);
    this.seenMessageOrder.push(id);
    if (this.seenMessageOrder.length > 5_000) {
      const oldest = this.seenMessageOrder.shift();
      if (oldest) this.seenMessageIds.delete(oldest);
    }
  }
}
