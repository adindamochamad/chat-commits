# Operator checklist (parallel to Codex build)

Full hackathon path: [HACKATHON_RUNBOOK.md](HACKATHON_RUNBOOK.md).

## Twitch Developer App

1. Enable **2FA** on the Twitch account (required for Developer Console).
2. [Twitch Developer Console](https://dev.twitch.tv/console/apps) → **Register Your Application**.
3. OAuth redirect URL: `http://localhost` (sufficient for user-token generation).
4. **Solo hackathon (recommended):** one account is both channel and bot — set `TWITCH_BROADCASTER_ID` and `TWITCH_BOT_USER_ID` to the same numeric ID; token owner must be that account.
5. **Optional later:** separate bot account; IDs and token owner must match the bot user.
6. Generate a **user access token** with scope **`user:read:chat`** ([Twitch Token Generator](https://twitchtokengenerator.com/) or your OAuth flow).
7. Resolve numeric IDs via [Twitch CLI](https://dev.twitch.tv/docs/cli/) or Helix `GET /users`.

Copy [`.env.example`](../.env.example) → `.env` (never commit `.env`):

| Variable | Source |
|---|---|
| `TWITCH_CLIENT_ID` | App Client ID |
| `TWITCH_CLIENT_SECRET` | App secret (for token refresh later; server ingest does not use it yet) |
| `TWITCH_BROADCASTER_ID` | Channel owner numeric ID |
| `TWITCH_BOT_USER_ID` | Bot account numeric ID — must match token owner |
| `TWITCH_BOT_TOKEN` | Bot user access token with `user:read:chat` |

Optional: `VOTING_WINDOW_MS` (default `60000`) — voting round length before `selectWinner()`.

## Overlay URLs (dev)

| Surface | URL |
|---|---|
| Overlay (OBS) | http://localhost:5173/ |
| Dashboard | http://localhost:5174/ |
| API | http://localhost:3000/api/state |

Production: run `npm run build` and serve static assets from the Node server (or keep Vite proxies pointed at `HTTP_PORT`).

## Smoke test (live)

```bash
npm install
npm run check:env
npm run dev:live
```

Do **not** set `SKIP_TWITCH=1` for live tests. `npm run dev:live` starts EventSub + overlay + dashboard (Vite proxies `/api` to port 3000). `npm run server` alone does not serve the overlay UI.

Expected logs: `EventSub connected`, `Subscribed to channel.chat.message`. In channel chat: `!commit test idea`, then `!vote <8-char-id>` during the voting window (ID shown on overlay).

## Smoke test (no Twitch)

```bash
npm run dev
```

Open dashboard → Demo proposal → Close voting now → Approve. Overlay should show lava.

## Codex evidence for video

In the build thread, run `/status` and capture Session ID `01a16c9a-be41-7f60-9ee3-1dc21ce91da6` on screen. Capture server log line `Codex is writing patch …` during a live or fixture merge.

## GitHub (Devpost repo URL)

```bash
gh repo create chat-commits --private --source=. --remote=origin --push
# Share with testing@devpost.com if the repo stays private
```

Replace repo name if `chat-commits` already exists on your account.
