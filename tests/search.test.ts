import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { App } from "obsidian";
import { BOOKS, BOOK_BY_OSIS } from "../src/core/books";
import { OfflineBibleLibrary } from "../src/core/library";
import {
  MAX_SEARCH_PHRASE_LENGTH,
  MAX_SEARCH_TERMS,
  booksForSearchScope,
  boundedSearchLimit,
  parseBibleSearchMatch,
  parseBibleSearchScope,
  prepareBibleSearchQuery,
  verseMatchesSearch
} from "../src/core/search";

const libraryPath = path.resolve("library/webp");
const john = BOOK_BY_OSIS.get("John")!;
const psalms = BOOK_BY_OSIS.get("Ps")!;

describe("offline Bible search scopes", () => {
  it("resolves canonical whole-Bible, testament, current, and selected-book scopes", () => {
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
    expect(booksForSearchScope("current-chapter", john)).toEqual([john]);
    expect(booksForSearchScope("selected-book", john, psalms)).toEqual([psalms]);
    expect(booksForSearchScope("selected-book", john, {...john, vpl: "../../outside"})).toEqual([john]);
    expect(() => booksForSearchScope("selected-book", john)).toThrow("Selected book is required for this search scope.");
    expect(() => booksForSearchScope("selected-book", john, {...john, osis: "Outside"}))
      .toThrow("Selected book is outside the supported 66-book canon.");
  });

  it("validates scope values and bounds result limits", () => {
    expect(parseBibleSearchScope("new-testament")).toBe("new-testament");
    expect(parseBibleSearchScope("current-chapter")).toBe("current-chapter");
    expect(parseBibleSearchScope("selected-book")).toBe("selected-book");
    expect(() => parseBibleSearchScope("../../outside")).toThrow("Unsupported Bible search scope.");
    expect(parseBibleSearchMatch("all-words")).toBe("all-words");
    expect(parseBibleSearchMatch("any-words")).toBe("any-words");
    expect(() => parseBibleSearchMatch("regex")).toThrow("Unsupported Bible search match mode.");
    expect(() => prepareBibleSearchQuery("God", "regex" as never)).toThrow("Unsupported Bible search match mode.");
    expect(verseMatchesSearch("God", prepareBibleSearchQuery("  ", "phrase"))).toBe(false);
    expect(verseMatchesSearch("God is love", prepareBibleSearchQuery("God world", "all-words"))).toBe(false);
    expect(verseMatchesSearch("God is love", prepareBibleSearchQuery("God world", "any-words"))).toBe(true);
    expect(verseMatchesSearch("Grace and peace", prepareBibleSearchQuery("God world", "any-words"))).toBe(false);
    expect(boundedSearchLimit(0)).toBe(1);
    expect(boundedSearchLimit(500)).toBe(200);
    expect(boundedSearchLimit(Number.POSITIVE_INFINITY)).toBe(80);
  });

  it("searches a directly selected canonical book without reading the current book", async () => {
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

    const page = await library.search({
      phrase: "The LORD is my shepherd",
      scope: "selected-book",
      match: "phrase",
      currentBook: john,
      selectedBook: psalms,
      limit: 10
    });

    expect(page.results.map(result => result.label)).toContain("Psalms 23:1");
    expect(page.results.every(result => result.book === psalms)).toBe(true);
    expect(reads).toEqual(["manifest.json", "PSA.json"]);
  });

  it("searches only the current canonical chapter and requires valid chapter context", async () => {
    const app = { vault: {
      configDir: ".obsidian",
      adapter: { read: async (name: string) => readFileSync(path.join(libraryPath, path.basename(name)), "utf8") }
    } } as unknown as App;
    const library = new OfflineBibleLibrary(app, "versedock");
    expect(await library.initialize()).toBe(true);

    const page = await library.search({
      phrase: "God",
      scope: "current-chapter",
      match: "phrase",
      currentBook: john,
      currentChapter: 3,
      limit: 200
    });
    expect(page.results.some(result => result.label === "John 3:16")).toBe(true);
    expect(page.results.every(result => result.chapter === 3)).toBe(true);

    await expect(library.search({
      phrase: "God",
      scope: "current-chapter",
      match: "phrase",
      currentBook: john,
      limit: 10
    })).rejects.toThrow("Current chapter is required for this search scope.");
    await expect(library.search({
      phrase: "God",
      scope: "current-chapter",
      match: "phrase",
      currentBook: john,
      currentChapter: 0,
      limit: 10
    })).rejects.toThrow("Current chapter is outside the supported range.");
    await expect(library.search({
      phrase: "God",
      scope: "current-chapter",
      match: "phrase",
      currentBook: john,
      currentChapter: 200,
      limit: 10
    })).rejects.toThrow("John does not have chapter 200.");
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
      match: "phrase",
      currentBook: john,
      limit: 1
    });
    expect(exact.results.map(result => result.label)).toContain("John 3:16");
    expect(exact.truncated).toBe(false);
    expect(reads).toEqual(["manifest.json", "JOH.json"]);

    const limited = await library.search({
      phrase: "God",
      scope: "current-book",
      match: "phrase",
      currentBook: john,
      limit: 2
    });
    expect(limited.results).toHaveLength(2);
    expect(limited.truncated).toBe(true);

    await expect(library.search({
      phrase: "x".repeat(MAX_SEARCH_PHRASE_LENGTH + 1),
      scope: "current-book",
      match: "phrase",
      currentBook: john,
      limit: 5
    })).rejects.toThrow("Search phrase must be 200 characters or fewer.");
    expect(reads).toEqual(["manifest.json", "JOH.json"]);
  });

  it("matches an exact phrase or all bounded words without changing verse text", async () => {
    const app = { vault: {
      configDir: ".obsidian",
      adapter: { read: async (name: string) => readFileSync(path.join(libraryPath, path.basename(name)), "utf8") }
    } } as unknown as App;
    const library = new OfflineBibleLibrary(app, "versedock");
    expect(await library.initialize()).toBe(true);

    const phrase = await library.search({
      phrase: "world God",
      scope: "current-book",
      match: "phrase",
      currentBook: john,
      limit: 10
    });
    expect(phrase.results.map(result => result.label)).not.toContain("John 3:16");

    const allWords = await library.search({
      phrase: "  world   God world  ",
      scope: "current-book",
      match: "all-words",
      currentBook: john,
      limit: 10
    });
    const john316 = allWords.results.find(result => result.label === "John 3:16");
    expect(john316?.text).toContain("For God so loved the world");

    await expect(library.search({
      phrase: Array.from({ length: MAX_SEARCH_TERMS + 1 }, (_, index) => "word" + index).join(" "),
      scope: "current-book",
      match: "all-words",
      currentBook: john,
      limit: 10
    })).rejects.toThrow("Search supports at most 16 words.");
  });

  it("matches any bounded literal word while preserving canonical verse text", async () => {
    const app = { vault: {
      configDir: ".obsidian",
      adapter: { read: async (name: string) => readFileSync(path.join(libraryPath, path.basename(name)), "utf8") }
    } } as unknown as App;
    const library = new OfflineBibleLibrary(app, "versedock");
    expect(await library.initialize()).toBe(true);

    const anyWords = await library.search({
      phrase: "world shepherd",
      scope: "current-book",
      match: "any-words",
      currentBook: john,
      limit: 200
    });
    expect(anyWords.results.find(result => result.label === "John 3:16")?.text)
      .toContain("For God so loved the world");

    await expect(library.search({
      phrase: Array.from({length: MAX_SEARCH_TERMS + 1}, (_, index) => "word" + index).join(" "),
      scope: "current-book",
      match: "any-words",
      currentBook: john,
      limit: 10
    })).rejects.toThrow("Search supports at most 16 words.");
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
      match: "phrase",
      currentBook: john,
      limit: 80,
      signal: controller.signal
    })).rejects.toMatchObject({ name: "AbortError" });
    expect(reads).toEqual(["manifest.json"]);
  });
});
