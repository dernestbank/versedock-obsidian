import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { BOOKS, BOOK_BY_OSIS } from "../src/core/books";
import { CrossReferenceLibrary } from "../src/core/cross-references";
import { parseReference, referenceId } from "../src/core/references";

const folder = path.resolve("library/crossrefs");
const read = async (file: string) => readFileSync(path.join(folder, file), "utf8");

describe("offline cross references", () => {
  it("loads attributed coordinates and resolves John 3:16 without a network", async () => {
    const library = new CrossReferenceLibrary(read);
    expect(await library.initialize()).toBe(true);
    expect(library.metadata?.license).toBe("CC BY 4.0");
    const results = await library.lookup(parseReference("John 3:16"));
    expect(results).toHaveLength(12);
    expect(results.map(result => referenceId(result.reference))).toContain("Rom.5.8");
    expect(results[0].votes).toBeGreaterThanOrEqual(results[1].votes);
  });

  it("deduplicates targets across a selected range and caps the visible result count", async () => {
    const library = new CrossReferenceLibrary(read);
    await library.initialize();
    const results = await library.lookup(parseReference("John 3:14-16"), 3);
    expect(results).toHaveLength(3);
    expect(new Set(results.map(result => referenceId(result.reference))).size).toBe(3);
    expect((await library.lookup(parseReference("John 3")))).toEqual([]);
  });

  it("reports missing data without exposing adapter paths", async () => {
    const library = new CrossReferenceLibrary(async file => {
      if (file === "JOH.json") throw new Error("/Users/private/Vault/JOH.json missing");
      return read(file);
    });
    await library.initialize();
    await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow(
      "Cross-reference data for John is unavailable or damaged.");
  });

  it("rejects a tampered book instead of displaying its coordinates", async () => {
    const library = new CrossReferenceLibrary(async file => {
      const raw = await read(file);
      return file === "JOH.json" ? raw.replace("Rom.5.8", "Rom.5.9") : raw;
    });
    await library.initialize();
    await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow("damaged");
  });

  it("rejects an unrecognized manifest and clears previously cached content", async () => {
    let broken = false;
    const library = new CrossReferenceLibrary(async file => broken ? "{}" : read(file));
    await library.initialize();
    await library.lookup(parseReference("John 3:16"));
    broken = true;
    expect(await library.initialize()).toBe(false);
    expect(library.metadata).toBeNull();
    await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow("not installed");
  });

  it("ships only coordinates present in WEB and matches every recorded book checksum", () => {
    const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
    const valid = new Set<string>();
    for (const book of BOOKS) {
      const bible = JSON.parse(readFileSync(path.resolve("library/webp", book.vpl + ".json"), "utf8"));
      for (const chapter of bible.chapters) for (const verse of chapter.verses)
        valid.add(`${book.osis}.${chapter.chapter}.${verse.verse}`);
    }
    let count = 0;
    for (const entry of manifest.books) {
      const raw = readFileSync(path.join(folder, entry.code + ".json"));
      expect(raw.byteLength).toBe(entry.bytes);
      expect(createHash("sha256").update(raw).digest("hex")).toBe(entry.sha256);
      const data = JSON.parse(raw.toString("utf8"));
      const book = BOOKS.find(book => book.vpl === data.code)!;
      let records = 0;
      for (const [key, targets] of Object.entries(data.references) as Array<[string, Array<[string, number]>]>) {
        if (!valid.has(book.osis + "." + key)) throw new Error("Unavailable origin " + key);
        for (const [target] of targets) {
          const [first, end] = target.split("-");
          const [osis, chapter, start] = first.split(".");
          if (!BOOK_BY_OSIS.has(osis)) throw new Error("Unknown target book");
          for (let verse = Number(start); verse <= Number(end ?? start); verse++)
            if (!valid.has(`${osis}.${chapter}.${verse}`)) throw new Error("Unavailable target " + target);
        }
        records += targets.length;
      }
      expect(records).toBe(entry.records);
      count += records;
    }
    expect(count).toBe(344016);
    expect(manifest.recordCount).toBe(count);
    expect(manifest.conversion.sourceRecords).toBe(count + manifest.conversion.omittedCrossChapterRanges
      + manifest.conversion.omittedUnavailableCoordinates);
  });

  it("counts missing installed cross-reference files in its storage summary", async () => {
    const library = new CrossReferenceLibrary(read, async file => file === "JOH.json" ? null : 10);
    await library.initialize();
    expect(await library.getStorageSummary()).toEqual({ files: 67, bytes: 670, missing: 1 });
  });
});
