# Hackathon DoD 100% runbook (26 Oct – 1 Nov)

Target: PRD §5 MUST on **live Twitch** + YouTube ≤3 min + Devpost by **1 Nov**. Hard close **3 Nov 2026 05:00 WIB**.

## Daily gates

| Day | Gate |
|---|---|
| 26 Oct | `.env` + `npm run check:env` + `EventSub connected` + `!commit` / `!vote` |
| 27 Oct | Full lava loop in OBS + Devpost screenshots |
| 28 Oct | All source clips per [VIDEO_SHOTLIST.md](VIDEO_SHOTLIST.md) |
| 29–30 Oct | Edit ≤3:00, English/captions |
| 31 Oct–1 Nov | YouTube public + [SUBMIT.md](SUBMIT.md) |

---

## 1. Twitch setup (solo: one account = broadcaster + bot)

1. Twitch → **Settings → Security → 2FA** (required for Developer Console).
2. [Register app](https://dev.twitch.tv/console/apps): OAuth redirect `http://localhost`, category Application Integration.
3. Token with scope **`user:read:chat`** for the **same** Twitch account ([Token Generator](https://twitchtokengenerator.com/) or OAuth).
4. Numeric user ID: `curl -s -H "Client-ID: $TWITCH_CLIENT_ID" -H "Authorization: Bearer $TWITCH_BOT_TOKEN" "https://api.twitch.tv/helix/users" | jq` or Twitch CLI `twitch api get users`.
5. Copy [`.env.example`](../.env.example) → `.env` (never commit):

```env
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_BROADCASTER_ID=<your numeric id>
TWITCH_BOT_USER_ID=<same numeric id>
TWITCH_BOT_TOKEN=<user token with user:read:chat>
VOTING_WINDOW_MS=15000
HTTP_PORT=3000
```

6. Verify: `npm run check:env`

Chat during dev (no Go Live required): `https://www.twitch.tv/popout/<your_login>/chat`

---

## 2. Live smoke (MUST 1)

```bash
npm install
npm run check:env
npm run dev:live
```

| Surface | URL |
|---|---|
| Overlay (OBS) | http://localhost:5173/ |
| Dashboard | http://localhost:5174/ |
| API | http://localhost:3000/api/state |

**Pass criteria**

- Terminal: `EventSub connected`, `Subscribed to channel.chat.message`
- Chat: `!commit make the floor lava every 10 seconds`
- Overlay vote panel shows **8-char proposal ID**
- Chat: `!vote <id>` → vote count increases in server log

If Codex is slow: add `USE_FIXTURES=1` to `.env` and use proposal text matching [fixtures/](../fixtures/) (e.g. “lava every 10 seconds”).

---

## 3. Lava loop + OBS (27 Oct)

OBS Browser Source: `http://localhost:5173/`, **1920×1080**, background **transparent**.

1. `!commit` + `!vote` (or wait for voting window)
2. Dashboard: pending patch → **Approve**
3. Overlay: lava floor + commit card (lower-third)
4. Optional: **Rollback last merge** on dashboard
5. Screenshots for Devpost: save as `docs/screenshots/overlay.png`, `docs/screenshots/dashboard.png`

---

## 4. Recording (28–30 Oct)

Follow [VIDEO_SHOTLIST.md](VIDEO_SHOTLIST.md) and [VIDEO_PRODUCTION.md](VIDEO_PRODUCTION.md). Checklist:

- [ ] Cold open 0:00–0:10 lava (no logo)
- [ ] 0:30–1:40 full loop with **Twitch chat visible**
- [ ] 1:40–2:20 Codex `/status` Session ID `01a16c9a-be41-7f60-9ee3-1dc21ce91da6` + log `Codex is writing`
- [ ] 2:20–2:50 `!commit fetch user data` → rejected on dashboard
- [ ] 2:50–3:00 “Chat ships code.”
- [ ] No copyrighted music; English or captions

Backup: `USE_FIXTURES=1` if Codex times out during a take.

---

## 5. Devpost submit (31 Oct – 1 Nov)

1. Upload video to YouTube (public).
2. Paste fields from [DEVPOST_DRAFT.md](DEVPOST_DRAFT.md).
3. Complete [SUBMIT.md](SUBMIT.md) checkboxes.
4. Repo: https://github.com/adindamochamad/chat-commits — if private, invite `testing@devpost.com`.
5. `npm run typecheck` before final push.
6. Submit on Devpost by **1 Nov** (buffer **2 Nov**; no edits after close).
