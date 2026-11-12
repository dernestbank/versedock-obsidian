import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { App } from "obsidian";
import { BOOKS } from "../src/core/books";
import { OfflineBibleLibrary } from "../src/core/library";
import { parseReference } from "../src/core/references";
const libraryPath = path.resolve("library/webp");
const manifest = JSON.parse(readFileSync(path.join(libraryPath, "manifest.json"), "utf-8"));

describe("official WEB content", () => {
  it("has 66 books and exactly 31,103 verses", () => {
    expect(manifest.books.length).toBe(66);
    expect(manifest.verseCount).toBe(31103);
    const files = readdirSync(libraryPath).filter(f => f.endsWith(".json") && f !== "manifest.json");
    expect(files).toHaveLength(66);
    const count = BOOKS.reduce((acc, b) => {
      const book = JSON.parse(readFileSync(path.join(libraryPath, b.vpl + ".json"), "utf-8"));
      expect(book.code).toBe(b.vpl);
      return acc + book.chapters.reduce((sum: number, c: { verses: unknown[] }) => sum + c.verses.length, 0);
    }, 0);
    expect(count).toBe(31103);
  });
  it("loads only requested books and reads real verses", async () => {
    const app = { vault: {
      configDir: ".obsidian",
      adapter: {
        read: async (name: string) => readFileSync(path.join(libraryPath, path.basename(name)), "utf-8")
      }
    }} as unknown as App;
    const reader = new OfflineBibleLibrary(app, "mysword-plus");
    expect(await reader.initialize()).toBe(true);
    const verses = await reader.getPassage(parseReference("John 3:16"));
    expect(verses).toHaveLength(1);
    expect(verses[0].text).toContain("For God so loved the world");
    expect((await reader.getChapter(parseReference("John 3"))).verses.length).toBeGreaterThan(30);
    const results = await reader.search("For God so loved the world", 5);
    expect(results.some(r => r.label === "John 3:16")).toBe(true);
  });
});
