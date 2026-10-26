# Devpost draft (English — paste into submission)

## Title

Chat Commits

## Tagline

Twitch chat ships code.

## Description

Chat Commits lets Twitch viewers propose new rules for a live overlay arcade game. Viewers type `!commit <idea>`; chat votes with `!vote <id>`; OpenAI Codex writes a TypeScript patch against a restricted `GameAPI`; the streamer approves or vetoes from a dashboard; the overlay hot-reloads the patch inside a sandboxed iframe.

**How we used Codex**

- **Build:** Most application code was written in an OpenAI Codex thread (Session ID: `01a16c9a-be41-7f60-9ee3-1dc21ce91da6`). See `/status` in that thread.
- **Runtime:** The production server uses `@openai/codex-sdk` to turn the winning chat proposal into a validated patch module on each voting round.

**Features**

- EventSub WebSocket chat ingest (`!commit`, `!vote`)
- Codex patch pipeline with banned-token scan, AST shape check, and `tsc`
- Streamer dashboard: approve, veto, rollback, commit log
- OBS overlay: canvas game, commit card, sandboxed patch runtime
- `fixtures/` backup patches for recording if Codex is slow

## Built with

OpenAI Codex, `@openai/codex-sdk`, Twitch EventSub, TypeScript, Node.js, Vite

## Repo

https://github.com/adindamochamad/chat-commits (share with `testing@devpost.com` if private)

## Codex Session ID

`01a16c9a-be41-7f60-9ee3-1dc21ce91da6`

## Try it

See README: `npm run dev` for local demo; `npm run check:env` + `npm run dev:live` for live Twitch.

## Submit day checklist

1. `npm run typecheck` && `npm run smoke:demo` (with `npm run dev` running)
2. Commit + push all source to GitHub
3. Upload video → paste URL here on Devpost
4. Add screenshots from [docs/screenshots/](screenshots/)
5. If repo private: share `testing@devpost.com` on GitHub
6. Click **Submit** on Devpost by 1 Nov 2026
