# Video production (record + edit + upload)

Companion to [VIDEO_SHOTLIST.md](VIDEO_SHOTLIST.md). Target **≤3:00**, **public YouTube**, English or captions.

## Before recording

- [ ] `npm run dev:live` (or `npm run dev` + fixtures for backup takes)
- [ ] `.env`: `VOTING_WINDOW_MS=15000`
- [ ] OBS: Browser Source `http://localhost:5173/`, 1920×1080, transparent
- [ ] Twitch chat popout visible for 0:30–1:40 segment
- [ ] Dashboard on second monitor or scene switch for approve/reject

## Clip list (record each as separate file)

1. `01-lava-cold-open.mov` — merged lava + commit card, no logo (10s)
2. `02-split-concept.mov` or stills — insomnia question + Twitch Plays vs Chat Commits
3. `03-full-loop.mov` — `!commit`, `!vote`, writing status, approve, lava (~70s)
4. `04-codex-build.mov` — Codex `/status` + terminal `Codex is writing`
5. `05-reject-fetch.mov` — `!commit fetch user data` → rejected in dashboard list
6. `06-closing.mov` — overlay text “Chat ships code.”

Malicious reject: if Codex does not emit `fetch`, dashboard **Rejected** list can be shown from a failed proposal; validator blocks banned tokens server-side.

## Edit

- Order per shotlist timestamps; hard cut at **3:00**
- No copyrighted music (use silence or royalty-free)
- Export 1080p H.264 for YouTube

## Upload

1. YouTube Studio → Create → title e.g. **Chat Commits — Codex x TwitchCon**
2. Visibility: **Public**
3. Description: link repo + one line “Built with OpenAI Codex”
4. Paste URL into Devpost ([SUBMIT.md](SUBMIT.md))
