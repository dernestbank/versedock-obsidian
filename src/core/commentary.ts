import { BOOKS } from "./books";
import type { LibraryStorageSummary } from "./library";
import { parseOsis, type PassageReference } from "./references";
import {parseCommentarySource,type CommentaryBlock,type CommentaryContent} from './commentary-content';

interface CommentaryCoordinate {chapter:number;verse:number;endVerse:number}
export type CommentaryEntry=CommentaryCoordinate&({source:string;blocks?:never}|{blocks:CommentaryBlock[];source?:never});
interface CommentaryBook { code: string; entries: CommentaryEntry[] }
interface BookManifest { code: string; entries: number; bytes: number; sha256: string }
export interface CommentaryManifest {
  id: "mhc"; schemaVersion: 1|2; title: string; edition: string;
  license: "Public Domain"; versification: "KJV"; entryCount: number; books: BookManifest[];
}
export const COMMENTARY_SOURCE = "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=MHC";

/** Immutable public-domain release assets, independent of the user-module importer. */
export class CommentaryLibrary {
  private manifest: CommentaryManifest | null = null;
  private cache = new Map<string, CommentaryBook>();
  private rendered=new Map<CommentaryEntry,CommentaryContent>();
  private revision=0;
  constructor(private readonly read: (file: string) => Promise<string>,
    private readonly fileSize?: (file: string) => Promise<number | null>) {}
  get metadata(): CommentaryManifest | null { return this.manifest; }

  async initialize(): Promise<boolean> {
    const revision=++this.revision;
    this.manifest = null;
    this.cache.clear();
    this.rendered.clear();
    try {
      const raw = await this.read("manifest.json");
      if (revision!==this.revision||raw.length > 30000) return false;
      const data = JSON.parse(raw) as CommentaryManifest;
      if (data.id !== "mhc" || ![1,2].includes(data.schemaVersion) || data.license !== "Public Domain"
        || data.versification !== "KJV" || data.title !== "Matthew Henry's Commentary" || data.edition !== "2.2 (2022-08-29)"
        || !Number.isSafeInteger(data.entryCount) || data.entryCount < 1 || data.entryCount > 10000
        || !Array.isArray(data.books) || data.books.length !== 66) return false;
      if (!BOOKS.every(book => data.books.filter(entry => entry.code === book.vpl).length === 1)) return false;
      if (!data.books.every(book => Number.isSafeInteger(book.entries) && book.entries > 0 && book.entries <= 2000
        && Number.isSafeInteger(book.bytes) && book.bytes > 0 && book.bytes <= 12000000
        && typeof book.sha256 === "string" && /^[a-f0-9]{64}$/.test(book.sha256))) return false;
      if (data.books.reduce((sum, book) => sum + book.entries, 0) !== data.entryCount) return false;
      this.manifest = data;
      return true;
    } catch { return false; }
  }

  async getStorageSummary(): Promise<LibraryStorageSummary> {
    const summary = { bytes: 0, files: 0, missing: 0 };
    if (!this.manifest || !this.fileSize) return summary;
    for (const file of ["manifest.json", "SOURCE-LICENSE.md", ...this.manifest.books.map(book => book.code + ".json")]) {
      try {
        const bytes = await this.fileSize(file);
        if (bytes === null) summary.missing++;
        else { summary.bytes += bytes; summary.files++; }
      } catch { summary.missing++; }
    }
    return summary;
  }

  private async load(ref: PassageReference): Promise<CommentaryBook> {
    if (!this.manifest) throw new Error("Commentary resource is not installed.");
    const manifest=this.manifest,revision=this.revision;
    const cached = this.cache.get(ref.book.vpl);
    if (cached) { this.cache.delete(ref.book.vpl); this.cache.set(ref.book.vpl, cached); return cached; }
    try {
      const entry = manifest.books.find(book => book.code === ref.book.vpl);
      if (!entry) throw new Error("Unknown commentary book");
      if (this.fileSize && await this.fileSize(entry.code + ".json") !== entry.bytes) throw new Error("File size mismatch");
      const raw = await this.read(entry.code + ".json");
      if (raw.length > 12000000) throw new Error("Oversized book");
      const bytes = new TextEncoder().encode(raw);
      if (bytes.length !== entry.bytes) throw new Error("Length mismatch");
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
      if (hash !== entry.sha256) throw new Error("Checksum mismatch");
      const data = JSON.parse(raw) as CommentaryBook;
      if (data.code !== entry.code || !Array.isArray(data.entries) || data.entries.length !== entry.entries)
        throw new Error("Invalid book structure");
      let lastChapter = 0, lastVerse = 0;
      for (const section of data.entries) {
        if (!Number.isSafeInteger(section.chapter) || !Number.isSafeInteger(section.verse)
          || !Number.isSafeInteger(section.endVerse) || section.verse < 1 || section.endVerse < section.verse
          || section.chapter < lastChapter || (section.chapter === lastChapter && section.verse <= lastVerse))
          throw new Error("Invalid section range");
        parseOsis(`${ref.book.osis}.${section.chapter}.${section.verse}-${section.endVerse}`);
        if(manifest.schemaVersion===2){
          if(typeof section.source!=='string'||!section.source.trim()||section.source.length>1024*1024||section.blocks!==undefined)throw Error('Invalid retained commentary source');
        }else if (section.source!==undefined||!Array.isArray(section.blocks) || !section.blocks.length || section.blocks.length > 2000
          || !section.blocks.every(block => ["paragraph", "heading", "quotation"].includes(block.kind)
            && typeof block.text === "string" && block.text.trim().length > 0 && block.text.length <= 100000))
          throw new Error("Invalid text blocks");
        lastChapter = section.chapter;
        lastVerse = section.endVerse;
      }
      if(revision!==this.revision||manifest!==this.manifest)throw Error('Commentary changed during loading');
      this.cache.set(entry.code, data);
      while (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value!);
      return data;
    } catch {
      throw new Error("Commentary data for " + ref.book.name + " is unavailable or damaged.");
    }
  }

  async lookup(ref: PassageReference): Promise<CommentaryEntry[]> {
    const book = await this.load(ref);
    return book.entries.filter(entry => entry.chapter === ref.chapter && (ref.verse === undefined
      || (entry.verse <= (ref.endVerse ?? ref.verse) && entry.endVerse >= ref.verse)));
  }

  /** Parse only displayed sections; chapter lookup itself does not build rich trees. */
  content(entry:CommentaryEntry):CommentaryContent {
    const cached=this.rendered.get(entry);
    if(cached){this.rendered.delete(entry);this.rendered.set(entry,cached);return cached;}
    // Legacy JSON is text data, never a prevalidated semantic tree.
    const content=entry.source!==undefined?parseCommentarySource(entry.source):{blocks:entry.blocks.map(({kind,text})=>({kind,text})),issues:['This legacy bundled asset contains plain text. Update the complete preview package to enable rich source formatting.'],complete:true};
    this.rendered.set(entry,content);
    while(this.rendered.size>4)this.rendered.delete(this.rendered.keys().next().value!);
    return content;
  }
}
