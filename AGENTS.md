# Chat Commits — agent guide

**New session:** read `CONTEXT.md` first, then this file, then `docs/PRD.md`.
PRD section 5 is the product contract. Do not expand scope. Do not rebuild strategy unless `docs/STATUS.md` records a failed Codex spike.

## Layout (target)
- `server/` Node + TypeScript: EventSub WebSocket client, Helix calls, proposal queue, Codex SDK pipeline, dashboard API, SSE to overlay.
- `overlay/` Vite + TypeScript: canvas game, sandboxed iframe that runs merged patches, commit card UI. Loaded in OBS as a browser source (1920x1080, transparent background).
- `dashboard/` streamer approve / veto / rollback page.
- `game-api/` the only surface patches may touch. Patches are ES modules exporting `apply(api: GameAPI): void | (() => void)`.
- `fixtures/` pre-generated patches for the demo backup.

## Patch rules
- Patches may only call `GameAPI`. Reject any patch containing `fetch`, `XMLHttpRequest`, `WebSocket`, `import(`, `eval`, `Function(`, `document`, `window`, `localStorage`, `postMessage`.
- Every patch must type-check against `game-api/index.d.ts` before reaching the dashboard.
- Patches run inside `<iframe sandbox="allow-scripts">` with CSP `default-src 'none'`.

## Design rules
- No purple gradients, glassmorphism, Inter-only typography, or emoji headings.
- Commit cards must stay readable at 720p stream quality.

## Commands
- `pnpm dev` runs server + overlay + dashboard.
- `pnpm typecheck` must pass before you say a task is done.

## Secrets
`.env` holds `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_BROADCASTER_ID`, `TWITCH_BOT_TOKEN`. Never commit it.
