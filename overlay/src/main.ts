import { mountPatchSandbox } from "../../game-api/sandbox-runtime.js";
import { createGame } from "./game.js";
import "./styles.css";

interface Proposal {
  id: string;
  text: string;
  author: { name: string };
  votes: number;
  status: string;
}

interface PatchRecord {
  id: string;
  proposalText: string;
  author: { name: string };
  status: string;
  createdAt: string;
}

interface CommitEntry {
  hash: string;
  proposalText: string;
  author: { name: string };
}

interface AppState {
  proposals: Proposal[];
  patches: PatchRecord[];
  commits: CommitEntry[];
  activeJavascript: string | null;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app");

const canvas = document.createElement("canvas");
canvas.id = "game";
canvas.width = 1920;
canvas.height = 1080;
app.append(canvas);

const sandboxHost = document.createElement("div");
sandboxHost.id = "sandbox-host";
app.append(sandboxHost);

const statusLine = document.createElement("div");
statusLine.className = "status-line";
statusLine.textContent = "Connecting…";
app.append(statusLine);

const votePanel = document.createElement("aside");
votePanel.className = "vote-panel";
votePanel.innerHTML = "<h2>Vote</h2><ul></ul>";
app.append(votePanel);
const voteList = votePanel.querySelector("ul")!;

const commitCard = document.createElement("div");
commitCard.className = "commit-card";
commitCard.innerHTML = `
  <div class="commit-card__row">
    <span class="commit-card__hash"></span>
    <span class="commit-card__author"></span>
  </div>
  <div class="commit-card__idea"></div>
`;
app.append(commitCard);
const hashEl = commitCard.querySelector(".commit-card__hash")!;
const authorEl = commitCard.querySelector(".commit-card__author")!;
const ideaEl = commitCard.querySelector(".commit-card__idea")!;

const game = createGame(canvas);
let sandbox: ReturnType<typeof mountPatchSandbox> | undefined;
let writingStartedAt: number | undefined;

function applyActivePatch(javascript: string | null): void {
  sandbox?.dispose();
  sandbox = undefined;
  if (!javascript) return;
  sandbox = mountPatchSandbox({
    host: sandboxHost,
    javascript,
    onFloorLava: (durationMs) => game.setFloorLava(durationMs),
    onError: (message) => {
      statusLine.textContent = `Patch error: ${message}`;
    },
  });
}

function showCommit(commit: CommitEntry): void {
  hashEl.textContent = commit.hash;
  authorEl.textContent = commit.author.name;
  ideaEl.textContent = commit.proposalText;
  commitCard.classList.add("visible");
  window.setTimeout(() => commitCard.classList.remove("visible"), 4000);
}

function renderVotes(proposals: Proposal[]): void {
  const voting = proposals.filter((p) => p.status === "voting");
  voteList.innerHTML = voting.length
    ? voting
        .map((p) => `<li><strong>${p.id}</strong> — ${p.votes} votes<br>${escapeHtml(p.text)}</li>`)
        .join("")
    : "<li>No open vote</li>";
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderState(state: AppState): void {
  renderVotes(state.proposals);
  const writing = state.patches.find((p) => p.status === "writing");
  if (writing) {
    if (!writingStartedAt) writingStartedAt = Date.now();
    const seconds = Math.floor((Date.now() - writingStartedAt) / 1000);
    statusLine.textContent = `writing… ${seconds}s`;
  } else {
    writingStartedAt = undefined;
    const pending = state.patches.filter((p) => p.status === "pending").length;
    statusLine.textContent = pending ? `${pending} patch(es) pending approval` : "Chat Commits";
  }
  applyActivePatch(state.activeJavascript);
  const latest = state.commits[state.commits.length - 1];
  if (latest && latest.hash !== commitCard.dataset.lastHash) {
    commitCard.dataset.lastHash = latest.hash;
    showCommit(latest);
  }
}

async function loadState(): Promise<void> {
  const res = await fetch("/api/state");
  const state = (await res.json()) as AppState;
  renderState(state);
}

function connectSse(): void {
  const source = new EventSource("/api/events");
  source.addEventListener("state", (event) => {
    const state = JSON.parse((event as MessageEvent).data) as AppState;
    renderState(state);
  });
  source.addEventListener("patch_merged", (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as AppState;
    renderState(payload);
  });
  source.addEventListener("rollback", (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as AppState;
    renderState(payload);
  });
  source.onerror = () => {
    statusLine.textContent = "SSE reconnecting…";
  };
}

function loop(): void {
  game.draw();
  requestAnimationFrame(loop);
}

void loadState();
connectSse();
loop();
