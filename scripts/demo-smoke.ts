/**
 * End-to-end smoke: demo proposal → close vote → pending → approve → activeJavascript.
 * Requires server on HTTP_PORT (e.g. npm run dev). Does not use Twitch.
 */
const base = process.env.HTTP_PORT ? `http://localhost:${process.env.HTTP_PORT}` : "http://localhost:3000";

async function post(path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function getState(): Promise<{
  pending: Array<{ id: string }>;
  activeJavascript: string | null;
  commits: Array<{ hash: string }>;
}> {
  const res = await fetch(`${base}/api/state`);
  if (!res.ok) throw new Error(`GET /api/state → ${res.status}`);
  return res.json() as Promise<{
    pending: Array<{ id: string }>;
    activeJavascript: string | null;
    commits: Array<{ hash: string }>;
  }>;
}

async function main(): Promise<void> {
  const health = await fetch(`${base}/api/state`);
  if (!health.ok) {
    console.error(`Server not reachable at ${base}. Start: npm run dev`);
    process.exit(1);
  }

  await post("/api/demo/proposal", {
    text: "make the floor lava every 10 seconds",
    authorName: "smoke_bot",
  });
  await post("/api/demo/close-voting");

  let pendingId: string | undefined;
  for (let i = 0; i < 30; i++) {
    const state = await getState();
    if (state.pending.length) {
      pendingId = state.pending[0]!.id;
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!pendingId) {
    console.error("No pending patch after demo proposal (fixture/Codex path failed).");
    process.exit(1);
  }

  await post(`/api/patches/${pendingId}/approve`);
  const final = await getState();
  if (!final.activeJavascript || !final.commits.length) {
    console.error("Approve did not set activeJavascript or commit log.");
    process.exit(1);
  }

  console.info("demo-smoke OK:", {
    commit: final.commits[final.commits.length - 1]!.hash,
    hasActivePatch: Boolean(final.activeJavascript),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
