# PRD: Chat Commits
*Hackathon: Codex x TwitchCon | Window: Oct 24 - Nov 1, 2026 (submit by Nov 2, 2:00pm PST) | Team: solo*

## 1. One-Liner
Twitch chat ships code. Viewers propose rule changes to a live overlay game, chat votes, Codex writes the patch, and the streamer approves it on air.

## 2. Insomnia Question
"What if chat didn't just play the game, but rewrote it mid-stream?"

## 3. Target User & Pain
- Primary user: mid-size streamers (50-2,000 concurrent viewers) who want chat to be part of the show rather than spectators.
- Pain today: chat interaction is capped at buttons. Polls, predictions, Twitch Plays, and channel points all choose from options the streamer defined ahead of time. Chat cannot invent anything.
- Stakes: dead chat means viewers leave. Most participation tools get old after one stream because the possibilities never change.

## 4. Solution & Ambition Ceiling
- Core: an OBS browser-source overlay running a small arcade game. `!commit <idea>` submits a proposal. The top-voted proposal goes to the Codex SDK, which writes a patch against a restricted game-rules API. The streamer approves or vetoes it from a dashboard, and the overlay hot-reloads the patch inside a sandbox.
- If it works: "the GitHub for live audiences." Every stream gets a versioned, community-authored game with its own commit history.
- Obvious sequels: v2 forks a game across raids, v3 Extension panel with diff view, v4 community "seasons" that replay the commit history.

## 5. MVP Scope
- MUST HAVE
  1. Chat ingest over EventSub WebSocket (`channel.chat.message`), with `!commit` and `!vote` commands.
  2. Codex patch pipeline: proposal -> Codex SDK thread -> TypeScript module that only uses `GameAPI` -> validate (type-check plus banned-token scan) -> pending.
  3. Overlay plus streamer dashboard: approve, veto, one-click rollback, and a visible commit log (hash, author, and the idea in chat's words).
- NICE TO HAVE: Codex streaming status shown on the overlay ("Codex is writing... 14s"), a replay/timelapse of the commit history, and a chat announcement after each merge.
- OUT OF SCOPE: multiple games, Twitch Extension, monetization/bits, multi-channel/raid, persistent accounts, mobile.

## 6. The Demo
- Wow moment: a viewer types `!commit make the floor lava every 10 seconds`. About 45 seconds later the overlay shows a commit card, the streamer clicks approve, and the floor turns to lava live on stream.
- Side-by-side: left, a classic Twitch Plays game where chat presses buttons. Right, Chat Commits where chat changes the rules. Same chat input, very different outcome.
- 3-minute video flow:
  - 0:00-0:10 cold open on the lava moment, no intro.
  - 0:10-0:30 the question plus the side-by-side split.
  - 0:30-1:40 full loop on a real Twitch stream: propose, vote, Codex writes, approve, merge, rollback.
  - 1:40-2:20 how it was built in Codex: the build thread, AGENTS.md, and a runtime Codex call shown in the logs.
  - 2:20-2:50 safety: a malicious proposal (`fetch` / `document`) gets rejected by the validator, then the commit-log timelapse.
  - 2:50-3:00 closing line.

## 7. Judging Criteria Mapping
| Criterion (25% each) | How we prove it |
|---|---|
| Innovation | Chat invents mechanics instead of picking from preset options; no known existing tool does this |
| Potential Impact | Real stream footage; commit history gives every stream lasting content |
| Tech + Codex | Codex is used to build the project AND runs inside the product loop; sandbox plus validator |
| Design | Commit cards look like an editorial stream graphic, not a SaaS UI; readable at 720p |

## 8. Tech Stack & Risk
- Stack: TypeScript. Node server (EventSub WS, Twitch Helix, `@openai/codex-sdk`), Vite overlay (canvas game plus sandboxed iframe), dashboard on the same server, SSE/WebSocket to the overlay.
- Biggest risk: Codex latency or broken patches. Mitigation: small surface (`GameAPI` with roughly 12 functions), a template prompt, one retry with compile errors, a 90s timeout, and auto-veto if validation fails.
- Safety: patches run in an iframe with `sandbox="allow-scripts"`, no network (CSP `default-src 'none'`), and postMessage to `GameAPI` only.
- Backup: if the live loop fails during recording, use a recorded run plus 3 pre-generated commits in `fixtures/`.

## 9. Prize Stacking
Single track. Target the top 5 (TwitchCon stage). Tie-break favors Innovation, which is our strongest score.

## 10. Timeline
- Oct 24: Codex login plus SDK spike, Twitch app setup, AGENTS.md.
- Oct 25-26: EventSub bot, proposal queue, voting.
- Oct 27-28: Codex patch pipeline plus validator plus sandbox runtime.
- Oct 29: base game plus GameAPI plus dashboard.
- Oct 30: design polish (overlay, commit card), rollback.
- Oct 31: record on a real stream, edit the video.
- Nov 1: README, Devpost submission, final submit. Nov 2: buffer.
