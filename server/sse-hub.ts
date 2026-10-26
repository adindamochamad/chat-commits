import type { ServerResponse } from "node:http";

export interface SseClient {
  id: string;
  res: ServerResponse;
}

/** Fan-out Server-Sent Events to overlay and dashboard clients. */
export class SseHub {
  private readonly clients = new Map<string, ServerResponse>();

  add(res: ServerResponse): string {
    const id = crypto.randomUUID();
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");
    this.clients.set(id, res);
    res.on("close", () => this.clients.delete(id));
    return id;
  }

  broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, res] of this.clients) {
      try {
        res.write(payload);
      } catch {
        this.clients.delete(id);
      }
    }
  }
}
