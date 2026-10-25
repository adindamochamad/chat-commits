import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { Codex } from "@openai/codex-sdk";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proposal = "make the floor lava every 10 seconds";
const apiDeclaration = await readFile(join(projectRoot, "game-api/index.d.ts"), "utf8");

function unwrapModule(text: string): string {
  const match = text.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/i);
  const module = (match?.[1] ?? text).trim();
  if (!module.includes("export") || !module.includes("apply")) {
    throw new Error(`Codex response did not contain a patch module:\n${text}`);
  }
  return `${module}\n`;
}

async function typecheck(source: string): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "chat-commits-spike-"));
  try {
    await writeFile(join(dir, "game-api.d.ts"), apiDeclaration);
    await writeFile(join(dir, "patch.ts"), source.replaceAll('"../game-api/index.js"', '"./game-api.js"'));
    await writeFile(join(dir, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        skipLibCheck: false,
      },
      files: ["game-api.d.ts", "patch.ts"],
    }));
    await new Promise<void>((resolvePromise, reject) => {
      const child = spawn(join(projectRoot, "node_modules/.bin/tsc"), ["--project", join(dir, "tsconfig.json")], {
        cwd: projectRoot,
        stdio: "inherit",
      });
      child.once("error", reject);
      child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`tsc exited ${code}`)));
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const startedAt = performance.now();
try {
  const codex = new Codex();
  const thread = codex.startThread({ workingDirectory: projectRoot });
  const result = await thread.run(`Write one TypeScript ES module patch for this proposal: "${proposal}".

The only permitted API is the following declaration:
${apiDeclaration}

Return only the complete module, preferably in a TypeScript code fence. It must export
function apply(api: GameAPI): void | (() => void). Import GameAPI from
"../game-api/index.js". Do not use any other imports or browser/global APIs.`);
  const moduleSource = unwrapModule(result.finalResponse);
  const patchPath = join(projectRoot, "spike/generated-patch.ts");
  await writeFile(patchPath, moduleSource);
  await typecheck(moduleSource);
  console.log(`PASS — patch type-checks (${((performance.now() - startedAt) / 1000).toFixed(2)}s)`);
} catch (error) {
  console.error(`FAIL — ${error instanceof Error ? error.message : String(error)} (${((performance.now() - startedAt) / 1000).toFixed(2)}s)`);
  process.exitCode = 1;
}
