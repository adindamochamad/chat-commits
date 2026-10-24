# Codex kickoff

Also read `CONTEXT.md` before the first prompt.

1. `npm i -g @openai/codex` then `codex login`.
2. `cd ~/Development/chat-commits && git init && git add -A && git commit -m "docs: hackathon context" && codex`
3. Run `/status` and save the session ID in `docs/STATUS.md` and Devpost notes. Keep building in this thread.

## Prompt 1 — spike (go/no-go, ~2h)
Read AGENTS.md and docs/PRD.md. Create `spike/codex-patch.ts` using `@openai/codex-sdk` that sends the proposal "make the floor lava every 10 seconds" with a stub `game-api/index.d.ts`, gets back a patch module, type-checks it, and prints the elapsed time. Run it 3 times and report latency and pass rate.

Go if median < 60s and ≥2/3 pass. Otherwise fall back to Codex generating patches offline into `fixtures/` with chat voting between them, or switch to idea B (Raid Relay).

## Prompt 2 onward
Follow PRD section 10 one day per prompt: "Implement the Oct 25-26 block from docs/PRD.md. Run pnpm typecheck."
