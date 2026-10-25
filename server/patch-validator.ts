import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import * as ts from "typescript";

const BANNED_PATTERNS: Array<[string, RegExp]> = [
  ["fetch", /\bfetch\b/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["dynamic import", /\bimport\s*\(/],
  ["eval", /\beval\s*\(/],
  ["Function constructor", /\bFunction\s*\(/],
  ["document", /\bdocument\b/],
  ["window", /\bwindow\b/],
  ["localStorage", /\blocalStorage\b/],
  ["postMessage", /\bpostMessage\b/],
];

export type PatchValidation =
  | { ok: true; javascript: string }
  | { ok: false; stage: "banned_token" | "shape" | "typecheck"; errors: string[] };

export async function validateAndCompilePatch(
  source: string,
  apiDeclaration: string,
): Promise<PatchValidation> {
  const banned = BANNED_PATTERNS.flatMap(([name, pattern]) =>
    pattern.test(source) ? [name] : [],
  );
  if (banned.length) {
    return { ok: false, stage: "banned_token", errors: [...new Set(banned)] };
  }
  if (/<\/script/i.test(source)) {
    return { ok: false, stage: "banned_token", errors: ["script-closing sequence"] };
  }

  const syntaxDiagnostics = (ts.transpileModule(source, { reportDiagnostics: true }).diagnostics ?? [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (syntaxDiagnostics.length) {
    return {
      ok: false,
      stage: "typecheck",
      errors: syntaxDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
    };
  }

  const apiMethods = readApiMethods(apiDeclaration);
  if (!apiMethods.ok) return { ok: false, stage: "shape", errors: apiMethods.errors };
  const structure = validateModuleShape(source, apiMethods.methods);
  if (!structure.ok) return { ok: false, stage: "shape", errors: structure.errors };

  const tempRoot = await mkdtemp(join(tmpdir(), "chat-commits-patch-"));
  const patchDir = join(tempRoot, "spike");
  const apiDir = join(tempRoot, "game-api");
  const patchPath = join(patchDir, "patch.ts");
  const apiPath = join(apiDir, "index.d.ts");
  try {
    await mkdir(patchDir, { recursive: true });
    await mkdir(apiDir, { recursive: true });
    await Promise.all([
      writeFile(patchPath, source),
      writeFile(apiPath, apiDeclaration),
    ]);
    const program = ts.createProgram({
      rootNames: [patchPath, apiPath],
      options: {
        strict: true,
        noEmit: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        skipLibCheck: true,
        types: [],
      },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    if (diagnostics.length) {
      return {
        ok: false,
        stage: "typecheck",
        errors: diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, tempRoot)),
      };
    }

    const emitted = ts.transpileModule(source, {
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        removeComments: true,
      },
    });
    const emitErrors = (emitted.diagnostics ?? []).filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    if (emitErrors.length) {
      return {
        ok: false,
        stage: "typecheck",
        errors: emitErrors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")),
      };
    }
    return { ok: true, javascript: emitted.outputText };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

function readApiMethods(declaration: string): { ok: true; methods: Set<string> } | { ok: false; errors: string[] } {
  const file = ts.createSourceFile("index.d.ts", declaration, ts.ScriptTarget.Latest, true);
  const apiInterface = file.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) && statement.name.text === "GameAPI",
  );
  if (!apiInterface) return { ok: false, errors: ["game-api/index.d.ts must declare interface GameAPI"] };
  const methods = new Set(apiInterface.members.flatMap((member) =>
    ts.isMethodSignature(member) && ts.isIdentifier(member.name) ? [member.name.text] : [],
  ));
  if (!methods.size) return { ok: false, errors: ["GameAPI must expose callable methods"] };
  return { ok: true, methods };
}

function validateModuleShape(
  source: string,
  apiMethods: Set<string>,
): { ok: true } | { ok: false; errors: string[] } {
  const file = ts.createSourceFile("patch.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const errors: string[] = [];
  const declarations = new Set<string>(["GameAPI"]);
  const addBinding = (name: ts.BindingName): void => {
    if (ts.isIdentifier(name)) declarations.add(name.text);
    else errors.push("Destructuring bindings are not allowed in patches");
  };
  let applyCount = 0;
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      const named = clause?.namedBindings;
      const names = named && ts.isNamedImports(named) ? named.elements : [];
      if (
        statement.moduleSpecifier.getText(file) !== '"../game-api/index.js"' ||
        !clause?.isTypeOnly ||
        clause.name ||
        !named ||
        !ts.isNamedImports(named) ||
        names.length !== 1 ||
        names[0]?.name.text !== "GameAPI"
      ) {
        errors.push('The only permitted import is `import type { GameAPI } from "../game-api/index.js"`');
      }
      continue;
    }
    if (!ts.isFunctionDeclaration(statement) || !statement.name) {
      errors.push("Patches may contain only the exported apply function and local function declarations");
      continue;
    }
    declarations.add(statement.name.text);
    const exported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    if (statement.name.text === "apply" && exported) {
      applyCount += 1;
      const parameter = statement.parameters[0];
      if (
        statement.parameters.length !== 1 ||
        !parameter ||
        !ts.isIdentifier(parameter.name) ||
        parameter.name.text !== "api" ||
        !parameter.type ||
        !ts.isTypeReferenceNode(parameter.type) ||
        !ts.isIdentifier(parameter.type.typeName) ||
        parameter.type.typeName.text !== "GameAPI"
      ) {
        errors.push("Export `apply` must have the signature `apply(api: GameAPI)`");
      }
    } else if (exported) {
      errors.push("Only `apply` may be exported");
    }
    for (const parameter of statement.parameters) addBinding(parameter.name);
  }
  if (applyCount !== 1) errors.push("Patch must export exactly one `apply(api: GameAPI)` function");

  const checkNode = (node: ts.Node): void => {
    if (
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node)
    ) {
      errors.push("Type assertions and non-null escapes are not allowed");
    }
    if (ts.isVariableDeclaration(node)) addBinding(node.name);
    if (ts.isParameter(node)) addBinding(node.name);
    if (ts.isPropertyAccessExpression(node)) {
      const isGameApiMethod = ts.isIdentifier(node.expression) &&
        node.expression.text === "api" && apiMethods.has(node.name.text);
      if (!isGameApiMethod) errors.push(`Property access '${node.getText(file)}' is outside GameAPI`);
      if (["constructor", "prototype", "__proto__", "caller", "callee"].includes(node.name.text)) {
        errors.push(`Property '${node.name.text}' is not allowed`);
      }
    }
    if (ts.isElementAccessExpression(node)) errors.push("Computed property access is not allowed");
    if (ts.isIdentifier(node) && !isIdentifierDeclarationOrPropertyName(node)) {
      if (node.text === "api") {
        const parent = node.parent;
        if (!ts.isPropertyAccessExpression(parent) || parent.expression !== node || !apiMethods.has(parent.name.text)) {
          errors.push("The GameAPI object may only be used to call declared GameAPI methods");
        }
      } else if (!declarations.has(node.text)) {
        errors.push(`Global or undeclared identifier '${node.text}' is not allowed`);
      }
    }
    ts.forEachChild(node, checkNode);
  };
  checkNode(file);
  return errors.length ? { ok: false, errors: [...new Set(errors)] } : { ok: true };
}

function isIdentifierDeclarationOrPropertyName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isFunctionDeclaration(parent) && parent.name === node) ||
    ((ts.isParameter(parent) || ts.isVariableDeclaration(parent)) && parent.name === node) ||
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isImportSpecifier(parent) && (parent.name === node || parent.propertyName === node))
  );
}

function formatDiagnostic(diagnostic: ts.Diagnostic, tempRoot: string): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (!diagnostic.file || diagnostic.start === undefined) return message;
  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const file = resolve(diagnostic.file.fileName).startsWith(resolve(tempRoot))
    ? diagnostic.file.fileName.slice(resolve(tempRoot).length + 1)
    : diagnostic.file.fileName;
  return `${file}:${line + 1}:${character + 1} ${message}`;
}
