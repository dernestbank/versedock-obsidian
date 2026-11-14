import type { App } from "obsidian";
import { BOOKS, type BookInfo } from "./books";
import type { PassageReference } from "./references";
import { refLabel } from "./references";
import { checkBookIntegrity, type IntegrityReport } from "./integrity";

export interface VerseData { verse: number; text: string }
export interface ChapterData { chapter: number; verses: VerseData[] }
interface BookData { code: string; chapters: ChapterData[] }
interface ManifestBook { code: string; chapters: number; verses: number; bytes: number; sha256: string }
export interface LibraryManifest {
  id: string; abbreviation: string; title: string; edition: string;
  license: string; licenseNotice: string; source: string; sourcePage: string;
  sourceSha256: string; verseCount: number; books: ManifestBook[];
}
export interface SearchResult { label: string; text: string; book: BookInfo; chapter: number; verse: number }

export class OfflineBibleLibrary {
  private readonly folder: string;
  private manifest: LibraryManifest | null = null;
  private cache = new Map<string, BookData>();
  constructor(private app: App, pluginId: string) {
    this.folder = app.vault.configDir + "/plugins/" + pluginId + "/library/webp";
  }
  get metadata(): LibraryManifest | null { return this.manifest; }
  async initialize(): Promise<boolean> {
    try {
      const content = await this.app.vault.adapter.read(this.folder + "/manifest.json");
      const data = JSON.parse(content) as LibraryManifest;
      if (data.id !== "webp" || data.books.length !== 66 || data.verseCount !== 31103) {
        throw new Error("Incorrect WEB manifest structure.");
      }
      this.manifest = data;
      return true;
    } catch {
      this.manifest = null;
      return false;
    }
  }
  getChapterCount(book: BookInfo): number {
    return this.manifest?.books.find(b => b.code === book.vpl)?.chapters ?? 0;
  }
  /** Checks installed files against their recorded lengths, checksums and chapter counts. */
  async verifyIntegrity(onProgress?: (checked: number, total: number) => void): Promise<IntegrityReport> {
    if (!this.manifest) return {
      checked: 0, total: 0, issues: [{ code: "manifest", problem: "No valid library manifest installed" }]
    };
    const books = this.manifest.books;
    const issues: IntegrityReport["issues"] = [];
    let checked = 0;
    for (const book of books) {
      try {
        if (!BOOKS.some(known => known.vpl === book.code)) {
          issues.push({ code: book.code, problem: "Unexpected book identifier in manifest" });
        } else {
          const raw = await this.app.vault.adapter.read(this.folder + "/" + book.code + ".json");
          for (const problem of await checkBookIntegrity(book, raw))
            issues.push({ code: book.code, problem });
        }
      } catch (error) {
        issues.push({ code: book.code, problem: "Unable to read or verify: " +
          (error instanceof Error ? error.message : String(error)) });
      }
      checked++;
      onProgress?.(checked, books.length);
    }
    return { checked, total: books.length, issues };
  }
  private async loadBook(book: BookInfo): Promise<BookData> {
    const cached = this.cache.get(book.vpl);
    if (cached) { this.cache.delete(book.vpl); this.cache.set(book.vpl, cached); return cached; }
    if (!this.manifest) throw new Error("Offline WEB module not installed.");
    const file = this.folder + "/" + book.vpl + ".json";
    const data = JSON.parse(await this.app.vault.adapter.read(file)) as BookData;
    if (data.code !== book.vpl || !Array.isArray(data.chapters)) {
      throw new Error("Damaged Bible module for " + book.name);
    }
    this.cache.set(book.vpl, data);
    while (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value!);
    return data;
  }
  async getChapter(ref: PassageReference): Promise<ChapterData> {
    const book = await this.loadBook(ref.book);
    const chapter = book.chapters.find(c => c.chapter === ref.chapter);
    if (!chapter) throw new Error(ref.book.name + " does not have chapter " + ref.chapter + ".");
    return chapter;
  }
  async getPassage(ref: PassageReference): Promise<VerseData[]> {
    const chapter = await this.getChapter(ref);
    if (ref.verse === undefined) return chapter.verses;
    const result = chapter.verses.filter(v => v.verse >= ref.verse! && v.verse <= (ref.endVerse ?? ref.verse!));
    if (result.length === 0) throw new Error("No verses found at " + refLabel(ref) + ".");
    return result;
  }
  async search(phrase: string, maxResults = 75): Promise<SearchResult[]> {
    if (!this.manifest) throw new Error("Offline WEB module not installed.");
    const term = phrase.trim().toLocaleLowerCase();
    if (term.length < 2) return [];
    const found: SearchResult[] = [];
    for (const book of BOOKS) {
      const data = await this.loadBook(book);
      for (const chapter of data.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLocaleLowerCase().includes(term)) {
            found.push({ label: book.name + " " + chapter.chapter + ":" + verse.verse, text: verse.text, book, chapter: chapter.chapter, verse: verse.verse });
            if (found.length >= maxResults) return found;
          }
        }
      }
    }
    return found;
  }
}
