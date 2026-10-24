# Chat Commits — session bootstrap

**Baca file ini dulu.** Folder ini adalah repo hackathon Codex x TwitchCon. Keputusan strategis sudah diambil. Yang belum: spike Codex SDK, build di thread Codex, video, submit.

Bahasa diskusi: Indonesia. Bahasa submission (README, Devpost, video): English.

## TL;DR

Chat Twitch tidak hanya main game overlay — mereka **menulis ulang aturannya**. `!commit <ide>` → vote → Codex SDK menulis patch TypeScript ke `GameAPI` terbatas → streamer approve/veto → overlay hot-reload di sandbox.

Nama: **Chat Commits**  
One-liner: *Twitch chat ships code.*  
The X for Y: *the GitHub for live audiences.*  
Insomnia question: *What if chat didn't just play the game, but rewrote it mid-stream?*  
Verdict: **GO** (ide A). Ide B Raid Relay = cadangan. Ide C Lore Keeper = DROP.

## Siapa kamu / siapa proyek ini

- Builder: solo, all-rounder, veteran hackathon, full-time ~8 hari, viewer Twitch (bukan streamer).
- Stack yang dipilih: TypeScript end-to-end. Node (EventSub + Codex SDK + dashboard API) + Vite overlay canvas. **Bukan Next.js/Convex di MVP** — PRD mempersempit ke Node + Vite agar selesai dalam 8 hari. Overlay OBS = halaman web 1920x1080 transparan.
- Codex CLI **belum terpasang** di mesin ini (`codex not found`, 24 Oct 2026). Login harus dilakukan user.

## Hackathon (fakta, jangan tebak ulang)

- URL: https://twitchcon-codex.devpost.com/
- Rules: https://twitchcon-codex.devpost.com/rules
- Sponsor: Amazon Advertising LLC. Tools featured: OpenAI Codex + Twitch.
- Submission: **23 Oct 2026 10:00 PDT – 2 Nov 2026 14:00 PST** = **3 Nov 2026 05:00 WIB**. Submit paling lambat **1 Nov**.
- Judging: ~3–15 Nov (situs vs rules sedikit beda tanggal; anggap sampai 15 Nov). Winners ~15 Nov TwitchCon San Diego. Hadiah uang **tidak** butuh hadir.
- Prizes (satu track saja): $10k / $6k / $4k / 2× $2,500 + stage. Top 5 tampil di Codex booth.
- User **sudah Join** Devpost. Indonesia **eligible** (bukan Brazil/Quebec/Rusia/Crimea/Kuba/Iran/DPRK/OFAC). Individu 18+, bukan organisasi.
- Wajib: proyek **baru di Submission Period**; terhubung Twitch; **dibangun dengan Codex**; **Codex Session ID** (`/status`); repo GitHub/GitLab/Bitbucket; video YouTube public ≤3 menit (kerja di Twitch **dan** cara pakai Codex); deskripsi English.

Stage 1 judging = pass/fail tema + pakai Codex.  
Stage 2 = 4 kriteria **bobot sama**: Innovation, Impact, Tech+Codex, Design. Tie-break urutan itu → Innovation paling berharga saat seri.

Median submission yang **dihindari**: chatbot GPT, AI mod, Twitch Plays, poll overlay, chat summarizer, TTS alerts, clip summarizer.

## File map

| File | Isi |
|---|---|
| [CONTEXT.md](CONTEXT.md) | File ini |
| [AGENTS.md](AGENTS.md) | Kontrak untuk Codex/Cursor saat coding |
| [docs/PRD.md](docs/PRD.md) | PRD 1 halaman — scope binding |
| [docs/STAGE0.md](docs/STAGE0.md) | Competition Brief |
| [docs/STAGE1.md](docs/STAGE1.md) | Validasi ide, 6 pola, skor, pitch video |
| [docs/ELIGIBILITY.md](docs/ELIGIBILITY.md) | Eligible + checklist pribadi |
| [docs/DESIGN.md](docs/DESIGN.md) | ATM / anti-slop overlay |
| [docs/SUBMIT.md](docs/SUBMIT.md) | Video, Devpost, Session ID |
| [docs/CODEX_KICKOFF.md](docs/CODEX_KICKOFF.md) | Prompt spike + build harian |
| [docs/STATUS.md](docs/STATUS.md) | Apa yang sudah/belum |

## Aturan session baru (penting)

1. **Jangan rewrite strategi** kecuali spike gagal (lihat kickoff: fallback fixtures atau ide B).
2. **Jangan build aplikasi di Cursor** sebagai sumber utama. Rules: built with Codex + Session ID dari thread tempat *most of the build* terjadi. Cursor = review, design notes, docs, debugging setelah Codex.
3. Scope PRD section 5 **binding**. OUT OF SCOPE: multi-game, Extension, bits, raid, akun persist, mobile.
4. Patch hanya `GameAPI`. Validator tolak `fetch`, `eval`, `document`, `window`, dll. Iframe `sandbox="allow-scripts"` + CSP `default-src 'none'`.
5. Demo 10 detik pertama = lava commit, **bukan** "Hi we are team X".

## Next action (satu-satunya yang memblokir)

```bash
npm i -g @openai/codex
codex login
cd ~/Development/chat-commits && git init && git add -A && git commit -m "docs: hackathon context"
codex   # /status → simpan Session ID
```

Paste Prompt 1 dari [docs/CODEX_KICKOFF.md](docs/CODEX_KICKOFF.md). GO spike jika median < 60s dan ≥2/3 patch lolos type-check.
