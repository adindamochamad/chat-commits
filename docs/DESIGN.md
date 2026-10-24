# Design — overlay anti-slop (Stage 2 ATM)

Centerpiece = overlay OBS, **bukan** landing marketing. Satu halaman demo + dashboard streamer cukup.

## Constraint overlay

- 1920×1080 browser source, background transparan (`rgba(0,0,0,0)`)
- Teks terbaca di 720p, 24px+ untuk body overlay, 48px+ untuk commit title
- Jangan full-bleed UI; game di tengah/bawah, commit card pojok (lower-third)
- Motion subtle: 200–400ms. Stream encoding menghancurkan animasi halus

## Hindari (juri tech-savvy, 3 detik)

Ungu-pink mesh, glassmorphism, Inter-only, Poppins, Lucide raw, grid 3×2 Features, "Welcome to Chat Commits", gradient text, scale-105 hover, emoji di heading.

## Arah visual (pilih saat polish, 30 Oct)

**Brutal terminal / git live:** off-black overlay cards `#171717` 90% opacity, 1px `#FFEB00` rule, IBM Plex Mono, commit hash kiri, author chat handle kanan. Terasa "git log di stream", bukan SaaS.

Bukan clone GitHub UI. Bukan clone Linear/Vercel.

## Referensi pola (tiru prinsip, bukan pixel)

Cari saat Stage 2 polish: lower-thirds esports (clean, high contrast); git GUI compact (diff hunk); arcade HUD (score, lives) — **satu** palet, bukan mashup tiga dunia.

## Signature

- Commit card masuk dari kiri seperti `git log --oneline` baru
- Hash 7-char + username Twitch
- Status Codex: `writing… 14s` mono, bukan spinner CSS default

## Copy

Hero/dashboard: "Chat ships code." Bukan "Unlock the power of AI to revolutionize your stream."
