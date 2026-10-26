# Chat Commits

Twitch chat ships code. Viewers propose live overlay-game rule changes; chat votes; Codex writes a sandboxed patch; the streamer merges it on stream.

Hackathon: [Codex x TwitchCon](https://twitchcon-codex.devpost.com/). **New session: read [CONTEXT.md](CONTEXT.md).** Contract for agents: [AGENTS.md](AGENTS.md). Product contract: [docs/PRD.md](docs/PRD.md).

## Codex Session ID

Build thread (Prompt 1 / main build): `01a16c9a-be41-7f60-9ee3-1dc21ce91da6` — run `/status` in that Codex thread before Devpost submit.

## Quick start (local demo, no Twitch)

Uses pre-generated `fixtures/` patches (`USE_FIXTURES=1`) and demo API endpoints.

```bash
npm install
npm run dev
```

| Surface | URL |
|---|---|
| Overlay (OBS Browser Source) | http://localhost:5173/ |
| Streamer dashboard | http://localhost:5174/ |
| HTTP API | http://localhost:3000/api/state |

OBS: Browser Source → `http://localhost:5173/`, **1920×1080**, background **transparent**.

Demo loop on dashboard: **Demo proposal** → **Close voting now** → **Approve** on overlay lava + commit card.

## Live Twitch

```bash
cp .env.example .env
# Fill Twitch app + token (user:read:chat). Solo hackathon: same account for broadcaster + bot. See docs/OPERATOR.md
npm run check:env
npm run dev:live
```

Chat: `!commit <idea>`, `!vote <8-char-proposal-id>` (IDs shown on overlay during voting). Hackathon checklist: [docs/HACKATHON_RUNBOOK.md](docs/HACKATHON_RUNBOOK.md).

Recording: set `VOTING_WINDOW_MS=15000` in `.env` for a ~45s wow loop.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Server + overlay + dashboard (demo env: `SKIP_TWITCH=1`, `USE_FIXTURES=1`, 15s vote window) |
| `npm run dev:live` | Live Twitch: EventSub + overlay + dashboard (requires `.env`, no `SKIP_TWITCH`) |
| `npm run check:env` | Validate `.env` before `dev:live` |
| `npm run smoke:demo` | E2E demo loop via API (server must be running) |
| `npm run server` | EventSub + HTTP API only (use with separate Vite or after `npm run build`) |
| `npm run typecheck` | TypeScript strict check |
| `npm run spike` | Codex SDK latency spike |
| `npm run build` | Production static builds for overlay + dashboard |

Package manager: **npm** (`package-lock.json`). `pnpm` works if you prefer; keep lockfile consistent.

## Architecture

Node server: Twitch EventSub WebSocket, in-memory proposals/votes, `@openai/codex-sdk` patch pipeline, validator + sandbox compile, HTTP API + SSE to overlay and dashboard. Vite overlay runs a canvas game and hot-reloads merged patches via `game-api/sandbox-runtime.ts` (`sandbox="allow-scripts"`, CSP `default-src 'none'`).

If live Codex is slow during recording, set `USE_FIXTURES=1` and use proposals matching `fixtures/` (e.g. “lava every 10 seconds”).

## License

MIT — see [LICENSE](LICENSE).
