/**
 * Validates .env for live Twitch (npm run dev:live). Does not call Twitch APIs.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");

const required = [
  "TWITCH_CLIENT_ID",
  "TWITCH_CLIENT_SECRET",
  "TWITCH_BROADCASTER_ID",
  "TWITCH_BOT_USER_ID",
  "TWITCH_BOT_TOKEN",
] as const;

function loadEnvFile(): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(envPath)) return map;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    map.set(key, value);
  }
  return map;
}

const env = loadEnvFile();
const missing = required.filter((key) => !env.get(key)?.trim());

if (!existsSync(envPath)) {
  console.error("Missing .env — copy .env.example to .env and fill Twitch values.");
  console.error("See docs/OPERATOR.md and docs/HACKATHON_RUNBOOK.md");
  process.exit(1);
}

if (missing.length) {
  console.error("Missing or empty in .env:", missing.join(", "));
  process.exit(1);
}

const broadcaster = env.get("TWITCH_BROADCASTER_ID")!.trim();
const botUser = env.get("TWITCH_BOT_USER_ID")!.trim();
if (broadcaster !== botUser) {
  console.warn(
    "TWITCH_BROADCASTER_ID and TWITCH_BOT_USER_ID differ — OK for separate bot; solo hackathon uses the same ID for both.",
  );
}

console.info("Twitch .env looks complete. Next: npm run dev:live and smoke test in channel chat.");
