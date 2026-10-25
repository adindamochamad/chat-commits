# Operator checklist (parallel to Codex build)

## Twitch Developer App

1. [Twitch Developer Console](https://dev.twitch.tv/console/apps) → **Register Your Application**.
2. OAuth redirect URL: `http://localhost` (sufficient for user-token generation).
3. Create or use a **bot user** (separate account recommended).
4. Generate a **user access token** for the bot with scope **`user:read:chat`** ([Twitch Token Generator](https://twitchtokengenerator.com/) or your OAuth flow).
5. Resolve IDs (broadcaster channel + bot user) via [Twitch CLI](https://dev.twitch.tv/docs/cli/) or Helix `GET /users`.

Copy [`.env.example`](../.env.example) → `.env` (never commit `.env`):

| Variable | Source |
|---|---|
| `TWITCH_CLIENT_ID` | App Client ID |
| `TWITCH_CLIENT_SECRET` | App secret (for token refresh later; server ingest does not use it yet) |
| `TWITCH_BROADCASTER_ID` | Channel owner numeric ID |
| `TWITCH_BOT_USER_ID` | Bot account numeric ID — must match token owner |
| `TWITCH_BOT_TOKEN` | Bot user access token with `user:read:chat` |

Optional: `VOTING_WINDOW_MS` (default `60000`) — voting round length before `selectWinner()`.

## Smoke test (live)

```bash
pnpm install
pnpm server
```

Expected logs: `EventSub connected`, `Subscribed to channel.chat.message`. In channel chat: `!commit test idea`, then `!vote <8-char-id>` during the voting window.

## GitHub (Devpost repo URL)

```bash
gh repo create chat-commits --private --source=. --remote=origin --push
# Share with testing@devpost.com if the repo stays private
```

Replace repo name if `chat-commits` already exists on your account.
