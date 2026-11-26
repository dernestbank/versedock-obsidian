import { bundledLibraryFolder } from "./bundled-library-files";
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

export interface WordToken { text: string; strongs?: string[]; lemmas?: string[]; morphology?: string[]; redLetter?: boolean; added?: boolean }
export interface VerseData { verse: number; text: string; tokens?: WordToken[]; source?:string }
export interface ChapterData { chapter: number; verses: VerseData[] }
interface BookData { code: string; chapters: ChapterData[] }
interface ManifestBook { code: string; chapters: number; verses: number; bytes: number; sha256: string }
export interface LibraryManifest {
  id: string; abbreviation: string; title: string; edition: string;
  language?: string;
  rightToLeft?: boolean;
  license: string; licenseNotice: string; source: string; sourcePage: string;
  sourceSha256: string; verseCount: number; books: ManifestBook[];
}
export interface SearchResult { label: string; text: string; book: BookInfo; chapter: number; verse: number }
export interface SearchPage { results: SearchResult[]; truncated: boolean }
export interface WordSearchPage extends SearchPage { total: number; offset: number }
export interface LibraryStorageSummary { bytes: number; files: number; missing: number }

/** Public reading contract shared by bundled and independently installed editions. */
export interface BibleResource {
  readonly edition:string;
  readonly metadata:LibraryManifest|null;
  getChapterCount(book:BookInfo):number;
  getChapter(ref:PassageReference):Promise<ChapterData>;
  getPassage(ref:PassageReference):Promise<VerseData[]>;
  search(request:BibleSearchRequest):Promise<SearchPage>;
  findStrongs(key:string,limit?:number,signal?:AbortSignal,offset?:number):Promise<WordSearchPage>;
  getStorageSummary():Promise<LibraryStorageSummary>;
  verifyIntegrity(onProgress?:(checked:number,total:number)=>void):Promise<IntegrityReport>;
}

export class OfflineBibleLibrary {
  private readonly files: ReturnType<typeof bundledLibraryFolder>;
  private manifest: LibraryManifest | null = null;
  private cache = new Map<string, BookData>();
  private occurrenceCache = new Map<string, readonly {book:BookInfo;chapter:number;verse:number}[]>();
  private generation = 0;
  constructor(app: App, pluginId: string, readonly edition: "webp" | "kjv" = "webp") {
    this.files = bundledLibraryFolder(app.vault.adapter, app.vault.configDir + "/plugins/" + pluginId, edition);
  }
  get metadata(): LibraryManifest | null { return this.manifest; }
  async initialize(): Promise<boolean> {
    const generation=++this.generation;
    this.cache.clear();
    this.occurrenceCache.clear();
    this.manifest = null;
    try {
      const content = await this.files.read("manifest.json");
      const data = JSON.parse(content) as LibraryManifest;
      if (content.length > 30000 || data.id !== this.edition || !Array.isArray(data.books) || data.books.length !== 66
        || data.verseCount !== (this.edition === "webp" ? 31103 : 31102)
        || !BOOKS.every(book => data.books.filter(entry => entry.code === book.vpl).length === 1)
        || !data.books.every(book => Number.isSafeInteger(book.bytes) && book.bytes > 0 && book.bytes < 5000000
          && /^[a-f0-9]{64}$/.test(book.sha256))) {
        throw new Error("Incorrect Bible manifest structure.");
      }
      if(generation!==this.generation)return false;
      this.manifest = data;
      return true;
    } catch {
      if(generation===this.generation)this.manifest = null;
      return false;
    }
  }
  getChapterCount(book: BookInfo): number {
    return this.manifest?.books.find(b => b.code === book.vpl)?.chapters ?? 0;
  }
  /** Measures the installed manifest and book files without exposing adapter paths. */
  async getStorageSummary(): Promise<LibraryStorageSummary> {
    if (!this.manifest) return { bytes: 0, files: 0, missing: 0 };
    const files = ["manifest.json", ...(this.edition === "kjv" ? ["SOURCE-LICENSE.md"] : []), ...this.manifest.books.map(book => book.code + ".json")];
    const measurements = await Promise.all(files.map(async file => {
      try {
        const size = await this.files.size(file);
        return size !== null ? { bytes: size, present: 1, missing: 0 } : { bytes: 0, present: 0, missing: 1 };
      } catch {
        return { bytes: 0, present: 0, missing: 1 };
      }
    }));
    return measurements.reduce((summary, measurement) => ({
      bytes: summary.bytes + measurement.bytes,
      files: summary.files + measurement.present,
      missing: summary.missing + measurement.missing
    }), { bytes: 0, files: 0, missing: 0 });
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
          const raw = await this.files.read(book.code + ".json");
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
    const generation=this.generation;
    const cached = this.cache.get(book.vpl);
    if (cached) { this.cache.delete(book.vpl); this.cache.set(book.vpl, cached); return cached; }
    if (!this.manifest) throw new Error("Offline " + (this.edition === "kjv" ? "KJV" : "WEB") + " module not installed.");
    const file = book.vpl + ".json";
    let data: BookData;
    try {
      if (this.edition === "kjv") {
        const expected = this.manifest.books.find(entry => entry.code === book.vpl)!;
        if (await this.files.size(file) !== expected.bytes) throw new Error("Length mismatch");
      }
      const raw = await this.files.read(file);
      if (this.edition === "kjv") {
        const fingerprint = this.manifest.books.find(entry => entry.code === book.vpl);
        if (!fingerprint || raw.length > 5000000 || (await checkBookIntegrity(fingerprint, raw)).length)
          throw new Error("Invalid tagged book");
      }
      data = JSON.parse(raw) as BookData;
    } catch {
      throw new Error("The installed offline Bible data for " + book.name + " is missing or unreadable.");
    }
    if (data.code !== book.vpl || !Array.isArray(data.chapters)) {
      throw new Error("Damaged Bible module for " + book.name);
    }
    if (this.edition === "kjv") for (const chapter of data.chapters) for (const verse of chapter.verses) {
      if (!Array.isArray(verse.tokens) || verse.tokens.length > 2000 || verse.tokens.map(token => token.text).join("") !== verse.text
        || !verse.tokens.every(token => typeof token.text === "string" && token.text.length < 10000
          && [token.strongs, token.lemmas, token.morphology].every(values => values === undefined || (Array.isArray(values)
            && values.length <= 20 && values.every(value => typeof value === "string" && value.length <= 200)))
          && (token.strongs ?? []).every(value => /^[GH][1-9][0-9]{0,4}$/.test(value))))
        throw new Error("The installed tagged Bible data for " + book.name + " is damaged.");
    }
    if(generation!==this.generation)throw new Error('Bible source changed; reopen the passage or word search.');
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
    const endVerse = ref.endVerse ?? ref.verse;
    const result = chapter.verses.filter(v => v.verse >= ref.verse! && v.verse <= endVerse);
    if (result.length === 0 || result[0].verse !== ref.verse || result[result.length - 1].verse !== endVerse) {
      throw new Error("No complete passage found at " + refLabel(ref) + ".");
    }
    return result;
  }
  async search(request: BibleSearchRequest): Promise<SearchPage> {
    if (!this.manifest) throw new Error("Offline " + (this.edition === "kjv" ? "KJV" : "WEB") + " module not installed.");
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

  async findStrongs(key: string, limit = 50, signal?: AbortSignal, offset = 0): Promise<WordSearchPage> {
    if (!/^[GH][1-9][0-9]{0,4}$/.test(key)) throw new Error("Invalid Strong's identifier.");
    if (this.edition !== "kjv") throw new Error("This edition has no verified word tags.");
    const results: SearchResult[] = [];
    if (!Number.isSafeInteger(offset) || offset < 0) throw new Error("Invalid occurrence offset.");
    const generation=this.generation;
    const assertActive=():void=>{
      if(signal?.aborted){const error=new Error('Word search cancelled.');error.name='AbortError';throw error;}
      if(generation!==this.generation)throw new Error('Bible source changed; reopen the word search.');
    };
    assertActive();
    const bounded = Math.min(100, Math.max(1, Math.floor(limit) || 50));
    let coordinates=this.occurrenceCache.get(key);
    if(coordinates){this.occurrenceCache.delete(key);this.occurrenceCache.set(key,coordinates);}
    else {
      const found:Array<{book:BookInfo;chapter:number;verse:number}>=[];
      for(const book of BOOKS){
        assertActive();const data=await this.loadBook(book);assertActive();
        for(const chapter of data.chapters){
          assertActive();
          for(const verse of chapter.verses)if(verse.tokens?.some(token=>token.strongs?.includes(key)))found.push({book,chapter:chapter.chapter,verse:verse.verse});
        }
      }
      assertActive();coordinates=found;this.occurrenceCache.set(key,coordinates);
      while(this.occurrenceCache.size>2)this.occurrenceCache.delete(this.occurrenceCache.keys().next().value!);
    }
    // Coordinates alone are cached. Each displayed page uses the verified book reader.
    for(const hit of coordinates.slice(offset,offset+bounded)){
      assertActive();const data=await this.loadBook(hit.book);assertActive();
      const verse=data.chapters.find(chapter=>chapter.chapter===hit.chapter)?.verses.find(verse=>verse.verse===hit.verse);
      if(!verse)throw new Error('Cached source coordinate is unavailable; recheck the Bible.');
      results.push({label:hit.book.name+' '+hit.chapter+':'+hit.verse,text:verse.text,...hit});
    }
    const total=coordinates.length;
    return { results, truncated: offset + results.length < total, total, offset };
  }
}
