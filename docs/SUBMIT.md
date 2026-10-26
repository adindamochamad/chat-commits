# Submit checklist

Deadline keras: **2 Nov 2026 14:00 PST = 3 Nov 2026 05:00 WIB**. Target **1 Nov**.

Setelah periode tutup, submission **tidak bisa diedit**.

Operator steps: [HACKATHON_RUNBOOK.md](HACKATHON_RUNBOOK.md) §5. Paste copy: [DEVPOST_DRAFT.md](DEVPOST_DRAFT.md). Screenshots: [screenshots/](screenshots/).

## Devpost fields

- [ ] Title: Chat Commits
- [ ] Tagline: Twitch chat ships code
- [ ] Description (EN): features + **how you used Codex** (build thread + runtime SDK)
- [ ] Built with: OpenAI Codex, Twitch EventSub, TypeScript, …
- [ ] Repo URL (all source, README install, env vars)
- [ ] If private: share with `testing@devpost.com`
- [ ] YouTube public ≤3 min
- [ ] Codex Session ID (`/status` di thread utama)
- [ ] Screenshots overlay + dashboard
- [ ] Demo stays runnable until judging ends (~15 Nov)

## Video

- Public YouTube, no copyrighted music, no third-party marks without permission
- Shows project **on Twitch**
- Shows **built with Codex**
- Judges may stop at 3:00
- English, or English captions/translation

## README (English)

Install, Twitch app scopes, `.env` example without secrets, OBS browser source URL, how to run a fixture commit if Codex is slow, architecture one paragraph.

- [x] README updated (see repo root)
- [x] MIT [LICENSE](../LICENSE)

## Pre-submit commands

```bash
npm run typecheck
npm run smoke:demo   # with npm run dev running in another terminal
npm run check:env    # after .env filled
```

## Backup demo

`fixtures/` tiga patch pre-generated jika live Codex timeout saat rekam.
