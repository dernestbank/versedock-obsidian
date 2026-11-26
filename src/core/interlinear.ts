import { BOOKS, type BookInfo } from "./books";
import type { PassageReference } from "./references";
import type { LibraryStorageSummary } from "./library";
import { INTERLINEAR_MANIFEST_BYTES, INTERLINEAR_MANIFEST_SHA256 } from "./interlinear-pins";

export type InterlinearLanguage = "hebrew" | "aramaic" | "greek";
export type InterlinearOrder = "source" | "english";
export interface InterlinearWord {
  readonly pos: number;
  readonly bsbPos: number;
  readonly language: InterlinearLanguage;
  readonly text: string;
  readonly transliteration: string | null;
  readonly parsing: string | null;
  readonly parsingFull: string | null;
  readonly strongs: string | null;
  readonly gloss: string | null;
}
export interface InterlinearVerse {
  readonly sourceId: "bsb-interlinear";
  readonly book: BookInfo;
  readonly chapter: number;
  readonly verse: number;
  readonly words: readonly InterlinearWord[];
}
interface ChapterEntry {
  book: string; sourceBook: string; chapter: number; file: string; bytes: number;
  sha256: string; rawSha256: string; verses: number[]; words: number;
}
interface InterlinearManifest {
  id: "bsb-interlinear"; schemaVersion: 1; verseCount: number; wordCount: number;
  chapters: ChapterEntry[];
}
const sourceAliases: Record<string, string> = { SOL: "SNG", EZE: "EZK", JOE: "JOL", NAH: "NAM", MAR: "MRK", JOH: "JHN", PHI: "PHP", JAM: "JAS", "1JO": "1JN", "2JO": "2JN", "3JO": "3JN" };
const languages: readonly InterlinearLanguage[] = ["hebrew", "aramaic", "greek"];
const books = new Map(BOOKS.map(book => [book.vpl, book]));
const MAX_CHAPTER_BYTES = 500_000;
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const hashPattern = /^[a-f0-9]{64}$/;

async function digest(raw: string): Promise<{ bytes: number; hash: string }> {
  const bytes = new TextEncoder().encode(raw);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return { bytes: bytes.byteLength, hash: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("") };
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function nullableText(value: unknown, max: number): value is string | null {
  return value === null || typeof value === "string" && value.length > 0 && value.length <= max;
}
/** Normalize padding only for dictionary lookup; never join words by Strong's ID. */
export function interlinearLexiconKey(raw: string | null): string | null {
  if (typeof raw !== "string" || !/^[HG][0-9]{1,5}$/.test(raw)) return null;
  const number = Number(raw.slice(1));
  return number > 0 ? raw[0] + number : null;
}
export function interlinearWordsForOrder(words: readonly InterlinearWord[], order: InterlinearOrder): readonly InterlinearWord[] {
  return [...words].sort((a, b) => order === "english" ? a.bsbPos - b.bsbPos : a.pos - b.pos);
}

/** Decode inert tuples; both ranks must be complete permutations, not a guessed join. */
export function decodeInterlinearChapter(raw: unknown, book: string, chapter: number): readonly InterlinearVerse[] {
  const canonical = books.get(book);
  if (!canonical || !integer(chapter, 1, 150) || !record(raw) || raw.format !== 1 || raw.source !== "bsb-interlinear"
    || raw.book !== book || raw.sourceBook !== (sourceAliases[book] ?? book) || raw.chapter !== chapter) throw new Error("Invalid interlinear coordinates.");
  if (!Array.isArray(raw.verses) || !integer(raw.verses.length, 1, 176)) throw new Error("Invalid interlinear verses.");
  let previous = 0;
  const result = raw.verses.map((row: unknown): InterlinearVerse => {
    if (!Array.isArray(row) || row.length !== 2 || !integer(row[0], previous + 1, 176)
      || !Array.isArray(row[1]) || !integer(row[1].length, 0, 100)) throw new Error("Invalid interlinear verse coordinates.");
    previous = row[0];
    const sourceRanks = new Set<number>(), englishRanks = new Set<number>();
    const words = row[1].map((tuple: unknown): InterlinearWord => {
      if (!Array.isArray(tuple) || tuple.length !== 9 || !integer(tuple[0], 1, row[1].length) || !integer(tuple[1], 1, row[1].length)
        || sourceRanks.has(tuple[0]) || englishRanks.has(tuple[1])) throw new Error("Invalid interlinear word position/rank.");
      sourceRanks.add(tuple[0]); englishRanks.add(tuple[1]);
      if (!integer(tuple[2], 0, 2) || typeof tuple[3] !== "string" || !tuple[3].length || tuple[3].length > 200
        || !nullableText(tuple[4], 200) || !nullableText(tuple[5], 200) || !nullableText(tuple[6], 500)
        || !nullableText(tuple[7], 6) || tuple[7] !== null && !interlinearLexiconKey(tuple[7]) || !nullableText(tuple[8], 500)) throw new Error("Invalid interlinear word fields.");
      return Object.freeze({ pos: tuple[0], bsbPos: tuple[1], language: languages[tuple[2]], text: tuple[3], transliteration: tuple[4],
        parsing: tuple[5], parsingFull: tuple[6], strongs: tuple[7], gloss: tuple[8] });
    });
    return Object.freeze({ sourceId: "bsb-interlinear", book: canonical, chapter, verse: row[0], words: Object.freeze(words) });
  });
  return Object.freeze(result);
}

/** Fixed, pinned local chapters; two-chapter LRU keeps reading memory bounded. */
export class InterlinearLibrary {
  private manifest: InterlinearManifest | null = null;
  private chapters = new Map<string, ChapterEntry>();
  private cache = new Map<string, readonly InterlinearVerse[]>();
  private epoch = 0;
  constructor(private readonly read: (file: string) => Promise<string>, private readonly size?: (file: string) => Promise<number | null>) {}
  get available(): boolean { return this.manifest !== null; }

  async initialize(): Promise<boolean> {
    const epoch = ++this.epoch;
    this.manifest = null; this.chapters.clear(); this.cache.clear();
    try {
      if (this.size && await this.size("manifest.json") !== INTERLINEAR_MANIFEST_BYTES) return false;
      const text = await this.read("manifest.json");
      if (text.length > INTERLINEAR_MANIFEST_BYTES) return false;
      const measured = await digest(text);
      if (measured.bytes !== INTERLINEAR_MANIFEST_BYTES || measured.hash !== INTERLINEAR_MANIFEST_SHA256) return false;
      const data: unknown = JSON.parse(text);
      if (!record(data) || data.id !== "bsb-interlinear" || data.schemaVersion !== 1 || data.verseCount !== 31102 || data.wordCount !== 443625
        || !Array.isArray(data.chapters) || data.chapters.length !== 1189) return false;
      const entries = new Map<string, ChapterEntry>();
      let verses = 0, words = 0;
      const bookChapters = new Map<string, number[]>();
      for (const item of data.chapters) {
        if (!record(item) || typeof item.book !== "string" || !books.has(item.book) || item.sourceBook !== (sourceAliases[item.book] ?? item.book)
          || !integer(item.chapter, 1, 150) || item.file !== `${item.book}-${item.chapter}.json`
          || !integer(item.bytes, 1, MAX_CHAPTER_BYTES) || typeof item.sha256 !== "string" || !hashPattern.test(item.sha256)
          || typeof item.rawSha256 !== "string" || !hashPattern.test(item.rawSha256) || !integer(item.words, 1, 10000)
          || !Array.isArray(item.verses) || !integer(item.verses.length, 1, 176)
          || !item.verses.every((verse, index, list) => integer(verse, index === 0 ? 1 : list[index - 1] + 1, 176))) return false;
        const key = `${item.book}-${item.chapter}`;
        if (entries.has(key)) return false;
        entries.set(key, item as unknown as ChapterEntry);
        bookChapters.set(item.book, [...bookChapters.get(item.book) ?? [], item.chapter]);
        verses += item.verses.length; words += item.words;
      }
      if (bookChapters.size !== 66 || verses !== 31102 || words !== 443625
        || [...bookChapters.values()].some(chapters => chapters.sort((a, b) => a - b).some((chapter, index) => chapter !== index + 1))) return false;
      if (epoch !== this.epoch) return false;
      this.chapters = entries; this.manifest = data as unknown as InterlinearManifest;
      return true;
    } catch { return false; }
  }

  async getVerse(ref: PassageReference): Promise<InterlinearVerse | null> {
    if (!ref || !ref.book || !books.has(ref.book.vpl) || !integer(ref.chapter, 1, 150)
      || ref.verse !== undefined && !integer(ref.verse, 1, 200)) throw new Error("Invalid interlinear book/verse coordinates.");
    if (!this.manifest) throw new Error("Berean interlinear companion is unavailable.");
    if (ref.verse === undefined) return null;
    const key = `${ref.book.vpl}-${ref.chapter}`;
    const expected = this.chapters.get(key);
    if (!expected || !expected.verses.includes(ref.verse)) return null;
    let data = this.cache.get(key);
    if (data) { this.cache.delete(key); this.cache.set(key, data); }
    else {
      const epoch = this.epoch;
      try {
        if (this.size && await this.size(expected.file) !== expected.bytes) throw new Error("Length mismatch");
        const text = await this.read(expected.file);
        if (text.length > MAX_CHAPTER_BYTES) throw new Error("Oversized chapter");
        const measured = await digest(text);
        if (measured.bytes !== expected.bytes || measured.hash !== expected.sha256) throw new Error("Checksum mismatch");
        data = decodeInterlinearChapter(JSON.parse(text), expected.book, expected.chapter);
        if (data.length !== expected.verses.length || data.some((verse, index) => verse.verse !== expected.verses[index])
          || data.reduce((sum, verse) => sum + verse.words.length, 0) !== expected.words) throw new Error("Chapter mismatch");
        if (epoch !== this.epoch) throw new Error("Source changed; reopen the interlinear companion.");
        this.cache.set(key, data);
        if (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value!);
      } catch (error) {
        if (epoch !== this.epoch) throw new Error("Source changed; reopen the interlinear companion.");
        throw new Error("Berean interlinear chapter is unavailable or damaged.");
      }
    }
    return data.find(verse => verse.verse === ref.verse) ?? null;
  }

  async getStorageSummary(): Promise<LibraryStorageSummary> {
    const summary = { bytes: 0, files: 0, missing: 0 };
    if (!this.manifest || !this.size) return summary;
    for (const file of ["manifest.json", "SOURCE-LICENSE.md", ...this.manifest.chapters.map(chapter => chapter.file)]) {
      try { const bytes = await this.size(file); if (bytes === null) summary.missing++; else { summary.bytes += bytes; summary.files++; } }
      catch { summary.missing++; }
    }
    return summary;
  }
}
