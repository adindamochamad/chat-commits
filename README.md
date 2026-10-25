# Chat Commits

Twitch chat ships code. Viewers propose live overlay-game rule changes; chat votes; Codex writes a sandboxed patch; the streamer merges it on stream.

Hackathon: [Codex x TwitchCon](https://twitchcon-codex.devpost.com/). **New session: read [CONTEXT.md](CONTEXT.md).** Contract for agents: [AGENTS.md](AGENTS.md). Product contract: [docs/PRD.md](docs/PRD.md).

The MVP is being built in OpenAI Codex (required). The server includes Twitch EventSub chat ingest, in-memory proposal voting, and a Codex patch pipeline. Overlay and dashboard work remains.

## Commands

```bash
pnpm install
cp .env.example .env   # fill in Twitch app and bot user access token values
pnpm server
pnpm typecheck
```

The bot user access token must have the `user:read:chat` scope. `TWITCH_BOT_USER_ID` is the Twitch user ID for that bot account. The server creates a WebSocket `channel.chat.message` subscription for the configured broadcaster. In chat, use `!commit <idea>` and `!vote <proposal-id>`; proposals and votes live in memory until the server stops. The server closes each voting window after `VOTING_WINDOW_MS` (60 seconds by default) and sends its winner through the Codex SDK pipeline. Validated patches are held in memory as pending review; failures are auto-rejected. `game-api/sandbox-runtime.ts` mounts compiled patches in an iframe with `sandbox="allow-scripts"` and a restrictive CSP.

OBS: Browser Source → overlay URL, 1920×1080, transparent.

## License

TBD at submit time.
