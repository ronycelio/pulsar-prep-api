import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");

function readText(relPath) {
  return fs.readFileSync(path.join(projectRoot, relPath), "utf8");
}

function exists(relPath) {
  return fs.existsSync(path.join(projectRoot, relPath));
}

test("Task 1 - core dependencies are installed in package.json", () => {
  const pkg = JSON.parse(readText("package.json"));
  const deps = pkg.dependencies ?? {};

  assert.ok(deps["@serwist/next"], "@serwist/next missing");
  assert.ok(deps.serwist, "serwist missing");
  assert.ok(deps.dexie, "dexie missing");
  assert.ok(deps["dexie-react-hooks"], "dexie-react-hooks missing");
  assert.ok(deps.zustand, "zustand missing");
});

test("Task 2 - PWA config and service worker artifacts exist", () => {
  assert.ok(exists("next.config.ts"), "next.config.ts missing");
  assert.ok(exists("src/app/sw.ts"), "src/app/sw.ts missing");
  assert.ok(exists("public/manifest.json"), "public/manifest.json missing");
  assert.ok(exists("public/icons/icon-192x192.png"), "icon-192x192 missing");
  assert.ok(exists("public/icons/icon-512x512.png"), "icon-512x512 missing");

  const nextConfig = readText("next.config.ts");
  assert.match(nextConfig, /withSerwist/);
  assert.ok(
    nextConfig.includes("cacheOnNavigation") ||
      nextConfig.includes("cacheOnFrontEndNav"),
    "Serwist cache-on-navigation flag missing",
  );
});

test("Task 3 - Dexie schema file defines required stores", () => {
  assert.ok(exists("src/lib/db/schema.ts"), "src/lib/db/schema.ts missing");

  const schemaText = readText("src/lib/db/schema.ts");
  assert.match(schemaText, /questions/);
  assert.match(schemaText, /progress/);
  assert.match(schemaText, /daily_state/);

  const dbIndex = readText("src/lib/db/index.ts");
  assert.match(dbIndex, /export const db/);
});

test("Task 4 - Tailwind and dark tokens are configured", () => {
  assert.ok(exists("tailwind.config.ts"), "tailwind.config.ts missing");
  const tailwindConfig = readText("tailwind.config.ts");
  assert.match(tailwindConfig, /darkMode\s*:\s*["']class["']/);
  assert.match(tailwindConfig, /zinc-950|#09090b/);

  const globals = readText("src/app/globals.css");
  assert.match(globals, /#09090b/);
  assert.match(globals, /--color-bg/);
});

test("AC 5 - useLiveQuery is available in source usage", () => {
  const srcDir = path.join(projectRoot, "src");
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && full.endsWith(".tsx")) {
        files.push(full);
      }
    }
  }

  walk(srcDir);
  const hasUsage = files.some((filePath) =>
    fs.readFileSync(filePath, "utf8").includes("useLiveQuery"),
  );

  assert.ok(hasUsage, "No useLiveQuery usage found");
});
