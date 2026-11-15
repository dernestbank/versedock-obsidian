#!/usr/bin/env node
/**
 * Read-only local performance QA for a user-supplied MySword Bible module.
 * Compilation, WASM setup, file I/O, and a warm-up pass are excluded from timings.
 * The report contains counts and references only—never Scripture text.
 */
import {createHash} from "node:crypto";
import {readFileSync, statSync} from "node:fs";
import path from "node:path";
import {build} from "esbuild";
import initSqlJs from "sql.js";
import {parseBenchmarkIterations, summarizeDurations} from "./benchmark-stats.mjs";

const root = process.cwd();
const provided = process.argv[2];
let iterations;
try {
  iterations = parseBenchmarkIterations(process.argv[3]);
} catch (error) {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exit(2);
}
if (!provided || process.argv.length > 4) {
  process.stderr.write(
    "Usage: npm run qa:mysword:benchmark -- /absolute/path/module.bbl.mybible [iterations]\n"
  );
  process.exit(2);
}

const modulePath = path.resolve(provided);
const baseName = path.basename(modulePath);
if (!/\.bbl\.mybible$/i.test(baseName)) {
  process.stderr.write("Expected an uncompressed .bbl.mybible file.\n");
  process.exit(2);
}

function compiledModule(entryPoint, label) {
  return build({
    entryPoints: [path.join(root, entryPoint)],
    platform: "neutral",
    format: "esm",
    bundle: true,
    write: false,
    logLevel: "silent"
  }).then(result => {
    const code = result.outputFiles?.[0]?.text;
    if (!code) throw new Error(`Unable to compile ${label}.`);
    return import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
  });
}

function stableOutcome(preview, preflight) {
  return JSON.stringify({
    preview: {
      books: preview.books,
      verses: preview.verses,
      sampleReferences: preview.samples.map(({book, chapter, verse}) => ({book, chapter, verse}))
    },
    preflight: {
      status: preflight.status,
      books: preflight.books,
      verses: preflight.verses,
      markupVerses: preflight.markupVerses,
      gbfMarkers: preflight.gbfMarkers,
      htmlMarkers: preflight.htmlMarkers,
      unknownMarkers: preflight.unknownMarkers,
      crossReferences: preflight.crossReferences,
      unresolvedCrossReferences: preflight.unresolvedCrossReferences,
      semanticReadyMarkupVerses: preflight.semanticReadyMarkupVerses,
      opaqueSemanticEvents: preflight.opaqueSemanticEvents,
      translatorNotes: preflight.translatorNotes,
      titles: preflight.titles,
      tagIssueVerses: preflight.tagIssueVerses,
      installsModule: preflight.installsModule
    }
  });
}

function roundedStats(samples) {
  return Object.fromEntries(Object.entries(summarizeDurations(samples)).map(([key, value]) =>
    [key, key === "iterations" ? value : Math.round(value * 1000) / 1000]));
}

function mebibytes(bytes) {
  return Math.round(bytes / 1024 / 1024 * 1000) / 1000;
}

try {
  let fileInfo;
  try {
    fileInfo = statSync(modulePath);
  } catch {
    throw new Error("Unable to read selected module file.");
  }
  const maxBytes = 24 * 1024 * 1024;
  if (!fileInfo.isFile() || fileInfo.size < 100 || fileInfo.size > maxBytes)
    throw new Error("Module must be a regular SQLite file between 100 bytes and 24 MiB.");
  let bytes;
  try {
    bytes = readFileSync(modulePath);
  } catch {
    throw new Error("Unable to read selected module file.");
  }
  const sourceHash = createHash("sha256").update(bytes).digest("hex");
  const [previewHelpers, preflightHelpers] = await Promise.all([
    compiledModule("src/core/mysword-preview.ts", "local inspector"),
    compiledModule("src/core/mysword-conversion-preflight.ts", "conversion preflight")
  ]);
  const wasm = readFileSync(path.join(root, "assets/sql-wasm.wasm"));
  const sql = await initSqlJs({wasmBinary: Uint8Array.from(wasm).buffer});

  // One untimed pass primes the JIT and proves the measured outputs stay identical.
  const warmPreview = previewHelpers.inspectMySwordBible(sql, baseName, bytes);
  const warmPreflight = preflightHelpers.preflightMySwordPlainText(sql, baseName, bytes);
  const expectedOutcome = stableOutcome(warmPreview, warmPreflight);
  const previewDurations = [];
  const preflightDurations = [];
  const combinedDurations = [];
  const baselineMemory = process.memoryUsage();
  const observedMemory = {...baselineMemory};

  for (let iteration = 0; iteration < iterations; iteration++) {
    globalThis.gc?.();
    const previewStart = performance.now();
    const preview = previewHelpers.inspectMySwordBible(sql, baseName, bytes);
    const previewEnd = performance.now();
    const preflight = preflightHelpers.preflightMySwordPlainText(sql, baseName, bytes);
    const preflightEnd = performance.now();
    if (stableOutcome(preview, preflight) !== expectedOutcome)
      throw new Error("Inspection results changed between benchmark iterations.");
    previewDurations.push(previewEnd - previewStart);
    preflightDurations.push(preflightEnd - previewEnd);
    combinedDurations.push(preflightEnd - previewStart);
    const memory = process.memoryUsage();
    for (const key of ["rss", "heapUsed", "external", "arrayBuffers"])
      observedMemory[key] = Math.max(observedMemory[key], memory[key]);
  }

  globalThis.gc?.();
  const cooperativeSegments = [];
  const cooperativeStart = performance.now();
  let segmentStart = cooperativeStart;
  const cooperative = await preflightHelpers.preflightMySwordPlainTextCooperatively(
    sql,
    baseName,
    bytes,
    {
      batchSize: 1000,
      yieldControl: async () => {
        cooperativeSegments.push(performance.now() - segmentStart);
        await new Promise(resolve => globalThis.setTimeout(resolve, 0));
        segmentStart = performance.now();
      }
    }
  );
  cooperativeSegments.push(performance.now() - segmentStart);
  const cooperativeEnd = performance.now();
  if (stableOutcome(warmPreview, cooperative) !== expectedOutcome)
    throw new Error("Cooperative preflight results differ from the synchronous baseline.");
  const cooperativeMemory = process.memoryUsage();
  for (const key of ["rss", "heapUsed", "external", "arrayBuffers"])
    observedMemory[key] = Math.max(observedMemory[key], cooperativeMemory[key]);

  const finalHash = createHash("sha256").update(bytes).digest("hex");
  if (finalHash !== sourceHash)
    throw new Error("Source bytes changed during benchmark execution.");
  const outcome = JSON.parse(expectedOutcome);
  const report = {
    schemaVersion: 1,
    filename: baseName,
    fileBytes: bytes.length,
    sha256: sourceHash,
    runtime: {node: process.version, platform: process.platform, architecture: process.arch},
    methodology: {
      iterations,
      warmupIterations: 1,
      excludes: ["file I/O", "SHA-256", "TypeScript bundling", "sql.js/WASM initialization"],
      garbageCollectionRequestedBeforeEachIteration: typeof globalThis.gc === "function",
      memoryScope: "process totals sampled after each iteration; not an in-operation peak or device-wide profile"
    },
    durationMilliseconds: {
      preview: roundedStats(previewDurations),
      conversionPreflight: roundedStats(preflightDurations),
      combined: roundedStats(combinedDurations),
      cooperativeUiSimulation: {
        batchSize: 1000,
        yields: cooperativeSegments.length - 1,
        total: Math.round((cooperativeEnd - cooperativeStart) * 1000) / 1000,
        workSegments: cooperativeSegments.length >= 3
          ? roundedStats(cooperativeSegments)
          : null
      }
    },
    processMemoryMiB: {
      baseline: {
        rss: mebibytes(baselineMemory.rss),
        heapUsed: mebibytes(baselineMemory.heapUsed),
        external: mebibytes(baselineMemory.external),
        arrayBuffers: mebibytes(baselineMemory.arrayBuffers)
      },
      maximumObservedAfterIteration: {
        rss: mebibytes(observedMemory.rss),
        heapUsed: mebibytes(observedMemory.heapUsed),
        external: mebibytes(observedMemory.external),
        arrayBuffers: mebibytes(observedMemory.arrayBuffers)
      }
    },
    corpus: outcome,
    safety: {
      sourceBytesUnchanged: true,
      scriptureTextOutput: false,
      filesCreatedOrModified: false,
      installsModule: false
    }
  };
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} catch (error) {
  process.stderr.write("Benchmark failed: " +
    (error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
}
