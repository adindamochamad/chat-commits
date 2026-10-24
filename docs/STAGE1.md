# Stage 1 — Ideation & verdict

## Profil (dari user)

- Role: all-rounder
- Stack: pilih yang peluang menang tertinggi → TypeScript web (overlay OBS)
- Hackathon: veteran
- Tim: solo, full-time ~8 hari
- Twitch: viewer aktif
- Bahasa: Indonesia (submit English)

## Kandidat

| Id | Nama | Verdict |
|---|---|---|
| A | Chat Commits | **GO** — user memilih ini 24 Oct 2026 |
| B | Raid Relay | Cadangan jika spike Codex gagal |
| C | Lore Keeper Overlay | DROP — ChatGPT Test borderline |

## 6 Winning Patterns (ide A)

1. **Failure yang ditakuti, bukan yang umum** — bukan "chat sepi" (sudah ada poll/channel points) tapi "chat tidak bisa menciptakan apa pun, hanya memilih dari menu streamer". Lulus.
2. **Stakes** — dead chat → viewers leave. Framing demo: chat *ships a mechanic that didn't exist 60 seconds ago*. Lulus untuk video; jangan overclaim "bencana".
3. **Side-by-side** — kiri Twitch Plays (input = tombol), kanan Chat Commits (input = aturan baru). Lulus.
4. **Framing** — satu kalimat: *What if chat didn't just play the game, but rewrote it mid-stream?* Lulus.
5. **Buktikan kriteria, jangan sentuh** — Innovation = chat invents mechanics. Codex = runtime loop + build thread. Design = commit card di overlay. Impact = footage stream + commit history. Lulus jika demo live.
6. **Nama mekanisme** — Chat Commits. 7/10 orang bisa tebak: chat yang commit kode. Lulus. Hindari Nexus/Aegis/SmartOverlay.

## ChatGPT Test

Lulus. Menghapus kata "AI" masih menyisakan: EventSub, vote, sandbox patch, streamer gate, overlay hot-reload. ChatGPT tidak bisa mensimulasikan loop Twitch live.

## 11 lensa (bobot: Innovation, Codex fit, Wow, Feasibility sprint)

| Lensa | Skor | Catatan |
|---|---|---|
| Pain clarity | 8 | Streamer mid-size, chat sebagai show |
| Differentiation | 9 | Bukan Twitch Plays |
| Feasibility | 7 | Latency/keamanan Codex = risiko #1 |
| Judge appeal | 9 | Codex di produk, bukan di footnote |
| Scalability | 8 | GitHub for live audiences |
| Chance of winning | 8 | Kalau spike GO |
| Uniqueness | 9 | |
| Wow | 9 | Lava commit |
| ChatGPT test | 9 | |
| Competition fit | 10 | |
| Ambition ceiling | 8 | Visi besar, MVP kecil |

**Verdict GO.** Optimasi bobot: Innovation + Tech/Codex dulu. Design cukup readable 720p, jangan Awwwards 3 hari.

## Pitch (video async, 3 menit)

10 detik pertama = wow, bukan intro tim.

```
0:00  Lava floor merge, no logo
0:10  Question + split Twitch Plays vs Chat Commits
0:30  Full loop on real Twitch
1:40  Codex build thread + /status + runtime call
2:20  Malicious patch rejected; commit log
2:50  "Chat ships code."
```

Q&A juri yang disiapkan: scale (satu game API, banyak overlay), vs Twitch Plays ( invent vs press), edge case (timeout 90s, retry, auto-veto, rollback).

## Risiko kompetitif

Tim lain: AI chat bots, overlays, Twitch Plays. Kita menang jika **Codex menulis kode yang benar-benar jalan di stream**, bukan men-generate teks ke chat.
