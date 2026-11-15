import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { App } from "obsidian";
import { BOOKS, BOOK_BY_OSIS } from "../src/core/books";
import { OfflineBibleLibrary } from "../src/core/library";
import {
  MAX_SEARCH_PHRASE_LENGTH,
  booksForSearchScope,
  boundedSearchLimit,
  parseBibleSearchScope
} from "../src/core/search";

const libraryPath = path.resolve("library/webp");
const john = BOOK_BY_OSIS.get("John")!;

describe("offline Bible search scopes", () => {
  it("resolves canonical whole-Bible, testament, and current-book scopes", () => {
    expect(booksForSearchScope("all", john)).toEqual(BOOKS);

    const oldTestament = booksForSearchScope("old-testament", john);
    expect(oldTestament).toHaveLength(39);
    expect(oldTestament[0].osis).toBe("Gen");
    expect(oldTestament.at(-1)?.osis).toBe("Mal");

    const newTestament = booksForSearchScope("new-testament", john);
    expect(newTestament).toHaveLength(27);
    expect(newTestament[0].osis).toBe("Matt");
    expect(newTestament.at(-1)?.osis).toBe("Rev");

    expect(booksForSearchScope("current-book", john)).toEqual([john]);
  });

  it("validates scope values and bounds result limits", () => {
    expect(parseBibleSearchScope("new-testament")).toBe("new-testament");
    expect(() => parseBibleSearchScope("../../outside")).toThrow("Unsupported Bible search scope.");
    expect(boundedSearchLimit(0)).toBe(1);
    expect(boundedSearchLimit(500)).toBe(200);
    expect(boundedSearchLimit(Number.POSITIVE_INFINITY)).toBe(80);
  });

  it("searches only the selected scope and reports real truncation", async () => {
    const reads: string[] = [];
    const app = { vault: {
      configDir: ".obsidian",
      adapter: { read: async (name: string) => {
        const file = path.basename(name);
        reads.push(file);
        return readFileSync(path.join(libraryPath, file), "utf8");
      } }
    } } as unknown as App;
    const library = new OfflineBibleLibrary(app, "versedock");
    expect(await library.initialize()).toBe(true);

    const exact = await library.search({
      phrase: "For God so loved the world",
      scope: "current-book",
      currentBook: john,
      limit: 1
    });
    expect(exact.results.map(result => result.label)).toContain("John 3:16");
    expect(exact.truncated).toBe(false);
    expect(reads).toEqual(["manifest.json", "JOH.json"]);

    const limited = await library.search({
      phrase: "God",
      scope: "current-book",
      currentBook: john,
      limit: 2
    });
    expect(limited.results).toHaveLength(2);
    expect(limited.truncated).toBe(true);

    await expect(library.search({
      phrase: "x".repeat(MAX_SEARCH_PHRASE_LENGTH + 1),
      scope: "current-book",
      currentBook: john,
      limit: 5
    })).rejects.toThrow("Search phrase must be 200 characters or fewer.");
    expect(reads).toEqual(["manifest.json", "JOH.json"]);
  });

  it("stops before reading a book when its search is already cancelled", async () => {
    const reads: string[] = [];
    const app = { vault: {
      configDir: ".obsidian",
      adapter: { read: async (name: string) => {
        const file = path.basename(name);
        reads.push(file);
        return readFileSync(path.join(libraryPath, file), "utf8");
      } }
    } } as unknown as App;
    const library = new OfflineBibleLibrary(app, "versedock");
    expect(await library.initialize()).toBe(true);
    const controller = new AbortController();
    controller.abort();

    await expect(library.search({
      phrase: "God",
      scope: "all",
      currentBook: john,
      limit: 80,
      signal: controller.signal
    })).rejects.toMatchObject({ name: "AbortError" });
    expect(reads).toEqual(["manifest.json"]);
  });
});
