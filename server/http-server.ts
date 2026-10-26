import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProposalQueue } from "./proposals.js";
import type { PatchPipeline } from "./patch-pipeline.js";
import { SseHub } from "./sse-hub.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface HttpServerDeps {
  port: number;
  queue: ProposalQueue;
  pipeline: PatchPipeline;
  votingWindowMs: number;
  demoMode: boolean;
  onCloseVoting?: () => void;
  onDemoProposal?: (text: string, author: { id: string; name: string }) => void;
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/** HTTP API, SSE, and static assets for overlay/dashboard production builds. */
export function createHttpServer(deps: HttpServerDeps): ReturnType<typeof createServer> {
  const sse = new SseHub();

  const snapshot = () => ({
    proposals: deps.queue.list(),
    patches: deps.pipeline.list(),
    pending: deps.pipeline.listPending(),
    commits: deps.pipeline.listCommits(),
    activeJavascript: deps.pipeline.getActiveJavascript() ?? null,
    votingWindowMs: deps.votingWindowMs,
    demoMode: deps.demoMode,
  });

  const broadcastState = (event: string) => {
    sse.broadcast(event, snapshot());
  };

  deps.pipeline.on("change", () => broadcastState("state"));
  deps.pipeline.on("pending", () => broadcastState("patch_pending"));
  deps.pipeline.on("merged", () => broadcastState("patch_merged"));
  deps.pipeline.on("vetoed", () => broadcastState("patch_vetoed"));
  deps.pipeline.on("rejected", () => broadcastState("patch_rejected"));
  deps.pipeline.on("rollback", () => broadcastState("rollback"));
  deps.queue.on("change", () => broadcastState("state"));
  deps.queue.on("selected", () => broadcastState("proposal_selected"));

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const path = url.pathname;

    if (req.method === "GET" && path === "/api/events") {
      sse.add(res);
      sse.broadcast("state", snapshot());
      return;
    }

    if (req.method === "GET" && path === "/api/state") {
      sendJson(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && path.startsWith("/api/patches/") && path.endsWith("/approve")) {
      const id = path.slice("/api/patches/".length, -"/approve".length);
      const result = deps.pipeline.approve(id);
      if (!result.ok) {
        sendJson(res, 400, { error: result.reason });
        return;
      }
      sendJson(res, 200, { commit: result.commit, activeJavascript: deps.pipeline.getActiveJavascript() });
      return;
    }

    if (req.method === "POST" && path.startsWith("/api/patches/") && path.endsWith("/veto")) {
      const id = path.slice("/api/patches/".length, -"/veto".length);
      const result = deps.pipeline.veto(id);
      if (!result.ok) {
        sendJson(res, 400, { error: result.reason });
        return;
      }
      sendJson(res, 200, { patch: result.record });
      return;
    }

    if (req.method === "POST" && path === "/api/patches/rollback") {
      const result = deps.pipeline.rollback();
      if (!result.ok) {
        sendJson(res, 400, { error: result.reason });
        return;
      }
      sendJson(res, 200, { activeJavascript: result.activeJavascript });
      return;
    }

    if (deps.demoMode && req.method === "POST" && path === "/api/demo/proposal") {
      try {
        const body = (await readJsonBody(req)) as { text?: string; authorName?: string };
        const text = typeof body.text === "string" ? body.text : "";
        const author = {
          id: "demo-user",
          name: typeof body.authorName === "string" ? body.authorName : "demo_viewer",
        };
        deps.onDemoProposal?.(text, author);
        broadcastState("state");
        sendJson(res, 200, { ok: true });
      } catch {
        sendJson(res, 400, { error: "invalid_json" });
      }
      return;
    }

    if (deps.demoMode && req.method === "POST" && path === "/api/demo/close-voting") {
      deps.onCloseVoting?.();
      broadcastState("state");
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET") {
      const staticMap: Record<string, string> = {
        "/": join(projectRoot, "overlay/dist/index.html"),
        "/overlay": join(projectRoot, "overlay/dist/index.html"),
        "/dashboard": join(projectRoot, "dashboard/dist/index.html"),
      };
      if (path === "/overlay/" || path === "/dashboard/") {
        const target = staticMap[path.slice(0, -1)] ?? staticMap[path];
        try {
          const html = await readFile(target, "utf8");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(html);
          return;
        } catch {
          sendJson(res, 404, { error: "not_built", hint: "Run pnpm build or use Vite dev servers" });
          return;
        }
      }
    }

    sendJson(res, 404, { error: "not_found" });
  });

  server.listen(deps.port, () => {
    console.info(`HTTP API listening on http://localhost:${deps.port}`);
  });

  return server;
}

export type { SseHub };
