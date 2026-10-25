export interface PatchSandboxOptions {
  host: HTMLElement;
  javascript: string;
  onFloorLava: (durationMs: number) => void;
  onError?: (message: string) => void;
}

export interface PatchSandbox {
  frame: HTMLIFrameElement;
  dispose(): void;
}

interface SandboxMessage {
  channel?: unknown;
  action?: unknown;
  durationMs?: unknown;
  message?: unknown;
}

/** Runs compiled, validated patch code with only the GameAPI bridge in a sandboxed iframe. */
export function mountPatchSandbox(options: PatchSandboxOptions): PatchSandbox {
  if (/<\/script/i.test(options.javascript)) {
    throw new Error("Patch JavaScript contains an unsafe script-closing sequence");
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "Chat Commits patch runtime");
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.setAttribute("aria-hidden", "true");
  frame.style.display = "none";

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = [...nonceBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const csp = `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"></head><body><script nonce="${nonce}">
"use strict";
const parentChannel = "chat-commits-patch-runtime";
const exports = {};
${options.javascript}
const cleanups = new Set();
const api = Object.freeze({
  setFloorLava(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs < 0 || durationMs > 60000) return;
    parent.postMessage({ channel: parentChannel, action: "setFloorLava", durationMs }, "*");
  },
  onInterval(callback, intervalMs) {
    if (typeof callback !== "function" || !Number.isFinite(intervalMs) || intervalMs < 1 || intervalMs > 60000) {
      return () => {};
    }
    const timer = setInterval(callback, intervalMs);
    const cleanup = () => { clearInterval(timer); cleanups.delete(cleanup); };
    cleanups.add(cleanup);
    return cleanup;
  }
});
try {
  const cleanup = exports.apply(api);
  if (typeof cleanup === "function") cleanups.add(cleanup);
} catch {
  parent.postMessage({ channel: parentChannel, action: "runtimeError", message: "Patch failed while applying" }, "*");
}
addEventListener("message", (event) => {
  if (event.data?.channel !== parentChannel || event.data?.action !== "dispose") return;
  for (const cleanup of [...cleanups]) {
    try { cleanup(); } catch {}
  }
  cleanups.clear();
});
</script></body></html>`;

  const handleMessage = (event: MessageEvent<SandboxMessage>): void => {
    if (event.source !== frame.contentWindow || event.data?.channel !== "chat-commits-patch-runtime") return;
    if (event.data.action === "setFloorLava") {
      const durationMs = event.data.durationMs;
      if (typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs >= 0 && durationMs <= 60000) {
        options.onFloorLava(durationMs);
      }
    } else if (event.data.action === "runtimeError" && typeof event.data.message === "string") {
      options.onError?.(event.data.message.slice(0, 300));
    }
  };
  window.addEventListener("message", handleMessage);
  options.host.append(frame);

  return {
    frame,
    dispose() {
      frame.contentWindow?.postMessage({ channel: "chat-commits-patch-runtime", action: "dispose" }, "*");
      window.removeEventListener("message", handleMessage);
      frame.remove();
    },
  };
}
