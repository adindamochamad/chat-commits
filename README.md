# Chat Commits

Twitch chat ships code. Viewers propose live overlay-game rule changes; chat votes; Codex writes a sandboxed patch; the streamer merges it on stream.

Hackathon: [Codex x TwitchCon](https://twitchcon-codex.devpost.com/). **New session: read [CONTEXT.md](CONTEXT.md).** Contract for agents: [AGENTS.md](AGENTS.md). Product contract: [docs/PRD.md](docs/PRD.md).

The MVP is being built in OpenAI Codex (required). The server currently includes Twitch EventSub chat ingest and in-memory proposals/voting; overlay and dashboard work remains.

## Commands

```bash
pnpm install
cp .env.example .env   # fill in Twitch app and bot user access token values
pnpm server
pnpm typecheck
```

The bot user access token must have the `user:read:chat` scope. `TWITCH_BOT_USER_ID` is the Twitch user ID for that bot account. The server creates a WebSocket `channel.chat.message` subscription for the configured broadcaster. In chat, use `!commit <idea>` and `!vote <proposal-id>`; proposals and votes live in memory until the server stops. `selectWinner()` is the queue handoff for the Codex pipeline.

OBS: Browser Source → overlay URL, 1920×1080, transparent.

## License

TBD at submit time.
