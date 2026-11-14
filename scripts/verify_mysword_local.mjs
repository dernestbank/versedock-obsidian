#!/usr/bin/env node
/**
 * Read-only local QA for user-supplied MySword Bible SQLite files.
 * No network calls, saved copies, conversions or verse text output.
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import initSqlJs from "sql.js";

const root = process.cwd();
const provided = process.argv[2];
if (!provided || process.argv.length !== 3) {
  process.stderr.write("Usage: npm run qa:mysword -- /absolute/path/module.bbl.mybible\n");
  process.exit(2);
}
const modulePath = path.resolve(provided);
if (!/\.bbl\.mybible$/i.test(path.basename(modulePath))) {
  process.stderr.write("Expected an uncompressed .bbl.mybible file.\n");
  process.exit(2);
}
const maxBytes = 24 * 1024 * 1024;
try {
  const fileInfo = statSync(modulePath);
  if (!fileInfo.isFile() || fileInfo.size < 100 || fileInfo.size > maxBytes)
    throw new Error("Module must be a regular SQLite file between 100 bytes and 24 MiB.");
  const bytes = readFileSync(modulePath);
  const result = await build({
    entryPoints: [path.join(root, "src/core/mysword-preview.ts")],
    platform: "neutral", format: "esm", bundle: true, write: false,
    logLevel: "silent"
  });
  const bundled = result.outputFiles?.[0]?.text;
  if (!bundled) throw new Error("Unable to compile local inspector.");
  const helpers = await import("data:text/javascript;base64," +
    Buffer.from(bundled).toString("base64"));
  const wasm = readFileSync(path.join(root, "assets/sql-wasm.wasm"));
  const sql = await initSqlJs({ wasmBinary: Uint8Array.from(wasm).buffer });
  const t0 = performance.now();
  const preview = helpers.inspectMySwordBible(sql, path.basename(modulePath), bytes);
  const report = {
    filename: path.basename(modulePath),
    fileBytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    inspectionMilliseconds: Math.round(performance.now() - t0),
    description: preview.description,
    abbreviation: preview.abbreviation,
    language: preview.language,
    version: preview.version,
    books: preview.books,
    verses: preview.verses,
    sampleReferences: preview.samples.map(({book, chapter, verse}) =>
      ({ book, chapter, verse })),
    warnings: preview.warnings
  };
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} catch (error) {
  process.stderr.write("Inspection failed: " +
    (error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
}
