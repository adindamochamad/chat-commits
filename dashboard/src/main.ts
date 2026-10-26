import "./styles.css";

interface PatchRecord {
  id: string;
  proposalText: string;
  author: { name: string };
  status: string;
  rejectionReason?: string;
  createdAt: string;
}

interface CommitEntry {
  hash: string;
  patchId: string;
  proposalText: string;
  author: { name: string };
  mergedAt: string;
}

interface AppState {
  pending: PatchRecord[];
  patches: PatchRecord[];
  commits: CommitEntry[];
  demoMode: boolean;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app");

app.innerHTML = `
  <header>
    <h1>Chat Commits</h1>
    <p>Streamer gate — approve, veto, rollback.</p>
  </header>
  <div class="demo-bar" id="demo-bar" hidden>
    <input id="demo-text" type="text" placeholder="!commit make the floor lava every 10 seconds" />
    <button type="button" id="demo-submit">Demo proposal</button>
    <button type="button" id="demo-close" class="secondary">Close voting now</button>
  </div>
  <main>
    <section>
      <h2>Pending patches</h2>
      <div id="pending"></div>
      <button type="button" id="rollback" class="secondary">Rollback last merge</button>
    </section>
    <section>
      <h2>Commit log</h2>
      <ol id="commit-log"></ol>
      <h2>Rejected</h2>
      <ul id="rejected"></ul>
    </section>
  </main>
`;

const pendingEl = document.querySelector<HTMLDivElement>("#pending")!;
const commitLogEl = document.querySelector<HTMLOListElement>("#commit-log")!;
const rejectedEl = document.querySelector<HTMLUListElement>("#rejected")!;
const rollbackBtn = document.querySelector<HTMLButtonElement>("#rollback")!;
const demoBar = document.querySelector<HTMLDivElement>("#demo-bar")!;
const demoText = document.querySelector<HTMLInputElement>("#demo-text")!;
const demoSubmit = document.querySelector<HTMLButtonElement>("#demo-submit")!;
const demoClose = document.querySelector<HTMLButtonElement>("#demo-close")!;

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(path, init);
}

function render(state: AppState): void {
  demoBar.hidden = !state.demoMode;
  pendingEl.innerHTML = state.pending.length
    ? state.pending
        .map(
          (patch) => `
        <article class="patch-card" data-id="${patch.id}">
          <div class="meta">${patch.id.slice(0, 7)} · ${patch.author.name}</div>
          <p>${escapeHtml(patch.proposalText)}</p>
          <div class="actions">
            <button type="button" data-action="approve">Approve</button>
            <button type="button" data-action="veto" class="secondary">Veto</button>
          </div>
        </article>`,
        )
        .join("")
    : "<p>No pending patches.</p>";


  commitLogEl.innerHTML = state.commits.length
    ? state.commits
        .map(
          (c) =>
            `<li><strong>${c.hash}</strong> ${escapeHtml(c.author.name)} — ${escapeHtml(c.proposalText)} <span class="meta">(${new Date(c.mergedAt).toLocaleTimeString()})</span></li>`,
        )
        .join("")
    : "<li>No merges yet.</li>";

  const rejected = state.patches.filter((p) => p.status === "rejected");
  rejectedEl.innerHTML = rejected.length
    ? rejected
        .map((p) => `<li>${p.id.slice(0, 7)}: ${escapeHtml(p.rejectionReason ?? "rejected")}</li>`)
        .join("")
    : "<li>None</li>";

  rollbackBtn.disabled = state.commits.length === 0;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function refresh(): Promise<void> {
  const res = await api("/api/state");
  const state = (await res.json()) as AppState & { pending: PatchRecord[] };
  render({
    pending: state.pending,
    patches: state.patches,
    commits: state.commits,
    demoMode: state.demoMode,
  });
}

rollbackBtn.addEventListener("click", async () => {
  await api("/api/patches/rollback", { method: "POST" });
  await refresh();
});

demoSubmit.addEventListener("click", async () => {
  await api("/api/demo/proposal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: demoText.value, authorName: "demo_viewer" }),
  });
  await refresh();
});

demoClose.addEventListener("click", async () => {
  await api("/api/demo/close-voting", { method: "POST" });
  await refresh();
});

pendingEl.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const action = target.getAttribute("data-action");
  if (!action) return;
  const card = target.closest<HTMLElement>(".patch-card");
  const id = card?.dataset.id;
  if (!id) return;
  if (action === "approve") await api(`/api/patches/${id}/approve`, { method: "POST" });
  if (action === "veto") await api(`/api/patches/${id}/veto`, { method: "POST" });
  await refresh();
});

function connectSse(): void {
  const source = new EventSource("/api/events");
  source.addEventListener("state", () => void refresh());
  source.addEventListener("patch_pending", () => void refresh());
  source.addEventListener("patch_merged", () => void refresh());
  source.addEventListener("patch_rejected", () => void refresh());
  source.addEventListener("rollback", () => void refresh());
}

void refresh();
connectSse();
