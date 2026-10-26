import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAndCompilePatch } from "./patch-validator.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FIXTURE_FILES = [
  "lava-every-10s.ts",
  "lava-every-5s.ts",
  "lava-on-start.ts",
] as const;

/** Loads a pre-generated fixture patch (demo / USE_FIXTURES=1). */
export async function loadFixturePatch(proposalText: string): Promise<
  | { ok: true; source: string; javascript: string; fixtureName: string }
  | { ok: false; reason: string }
> {
  const apiDeclaration = await readFile(join(projectRoot, "game-api/index.d.ts"), "utf8");
  const normalized = proposalText.toLowerCase();
  let chosen = "lava-every-10s.ts";
  if (normalized.includes("5 second") || normalized.includes("5s")) {
    chosen = "lava-every-5s.ts";
  } else if (normalized.includes("start") || normalized.includes("once")) {
    chosen = "lava-on-start.ts";
  }

  const source = await readFile(join(projectRoot, "fixtures", chosen), "utf8");
  const validation = await validateAndCompilePatch(source, apiDeclaration);
  if (!validation.ok) {
    return { ok: false, reason: `${validation.stage}: ${validation.errors.join("; ")}` };
  }
  return { ok: true, source, javascript: validation.javascript, fixtureName: chosen };
}

export function listFixtureNames(): readonly string[] {
  return FIXTURE_FILES;
}
