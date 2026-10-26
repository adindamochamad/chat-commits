# Video shotlist (≤3 min, English)

Target: public YouTube before Devpost. No copyrighted music. Recording setup: [HACKATHON_RUNBOOK.md](HACKATHON_RUNBOOK.md) §3–4.

| Time | Shot | Source |
|---|---|---|
| 0:00–0:10 | Lava floor + commit card, no logo | OBS overlay on real or demo stream |
| 0:10–0:30 | Insomnia question + Twitch Plays vs Chat Commits split | B-roll or split screen |
| 0:30–1:40 | Full loop: `!commit`, `!vote`, Codex writing status, dashboard approve, lava | Live Twitch chat visible |
| 1:40–2:20 | Codex build: screen `/status` Session ID + terminal log `Codex is writing` | Codex CLI thread |
| 2:20–2:50 | `!commit fetch user data` → rejected; commit log timelapse | Dashboard rejected list |
| 2:50–3:00 | “Chat ships code.” | Text on overlay |

## Recording checklist

- [ ] `VOTING_WINDOW_MS=15000` in `.env`
- [ ] Overlay Browser Source 1920×1080 transparent
- [ ] Proposal IDs readable on overlay
- [ ] Backup: `USE_FIXTURES=1` if Codex timeout during take
- [ ] Session ID visible in build segment
