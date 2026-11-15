import type { App } from "obsidian";
import { BOOKS, type BookInfo } from "./books";
import type { PassageReference } from "./references";
import { refLabel } from "./references";
import { checkBookIntegrity, type IntegrityReport } from "./integrity";
import {
  booksForSearchScope,
  boundedSearchLimit,
  currentChapterForSearchScope,
  prepareBibleSearchQuery,
  verseMatchesSearch,
  type BibleSearchRequest
} from "./search";

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
export interface SearchPage { results: SearchResult[]; truncated: boolean }

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
      } catch {
        issues.push({ code: book.code, problem: "Unable to read or verify this installed book file" });
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
    let data: BookData;
    try {
      data = JSON.parse(await this.app.vault.adapter.read(file)) as BookData;
    } catch {
      throw new Error("The installed offline Bible data for " + book.name + " is missing or unreadable.");
    }
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
  async search(request: BibleSearchRequest): Promise<SearchPage> {
    if (!this.manifest) throw new Error("Offline WEB module not installed.");
    const query = prepareBibleSearchQuery(request.phrase, request.match);
    const limit = boundedSearchLimit(request.limit);
    const books = booksForSearchScope(request.scope, request.currentBook, request.selectedBook);
    const currentChapter = currentChapterForSearchScope(request.scope, request.currentChapter);
    const assertActive = (): void => {
      if (request.signal?.aborted) {
        const error = new Error("Bible search cancelled.");
        error.name = "AbortError";
        throw error;
      }
    };
    assertActive();
    if (query.normalized.length < 2) return { results: [], truncated: false };
    const found: SearchResult[] = [];
    for (const book of books) {
      assertActive();
      const data = await this.loadBook(book);
      const chapters = currentChapter === undefined
        ? data.chapters
        : data.chapters.filter(chapter => chapter.chapter === currentChapter);
      if (currentChapter !== undefined && chapters.length === 0) {
        throw new Error(book.name + " does not have chapter " + currentChapter + ".");
      }
      for (const chapter of chapters) {
        assertActive();
        for (const verse of chapter.verses) {
          if (verseMatchesSearch(verse.text, query)) {
            found.push({ label: book.name + " " + chapter.chapter + ":" + verse.verse, text: verse.text, book, chapter: chapter.chapter, verse: verse.verse });
            if (found.length > limit) return { results: found.slice(0, limit), truncated: true };
          }
        }
      }
    }
    return { results: found, truncated: false };
  }
}
