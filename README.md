# Chat Commits

Twitch chat ships code. Viewers propose live overlay-game rule changes; chat votes; Codex writes a sandboxed patch; the streamer merges it on stream.

Hackathon: [Codex x TwitchCon](https://twitchcon-codex.devpost.com/). **New session: read [CONTEXT.md](CONTEXT.md).** Contract for agents: [AGENTS.md](AGENTS.md). Product contract: [docs/PRD.md](docs/PRD.md).

Build happens in OpenAI Codex (required). This repo currently holds strategy and docs only.

## Commands (after Codex implements)

```bash
pnpm install
cp .env.example .env   # then fill Twitch + Codex auth
pnpm dev
pnpm typecheck
```

OBS: Browser Source → overlay URL, 1920×1080, transparent.

## License

TBD at submit time.
