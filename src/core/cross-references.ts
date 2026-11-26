import { BOOKS } from "./books";
import type { LibraryStorageSummary } from "./library";
import { parseOsis, referenceId, type PassageReference } from "./references";

interface CrossReferenceBook { code: string; records: number; bytes: number; sha256: string }
export interface CrossReferenceManifest {
  id: "openbible-crossrefs"; schemaVersion: 1; title: string; edition: string;
  license: "CC BY 4.0"; recordCount: number; books: CrossReferenceBook[];
}
export interface CrossReference { reference: PassageReference; votes: number }
type BookReferences = Map<string, CrossReference[]>;
export const CROSS_REFERENCE_SOURCE = "https://www.openbible.info/labs/cross-references/";
export const CROSS_REFERENCE_LICENSE = "https://creativecommons.org/licenses/by/4.0/";

/** A separate bundled coordinate resource; no network access and a two-book cache. */
export class CrossReferenceLibrary {
  private manifest: CrossReferenceManifest | null = null;
  private cache = new Map<string, BookReferences>();
  constructor(private readonly read: (file: string) => Promise<string>,
    private readonly fileSize?: (file: string) => Promise<number | null>) {}
  get metadata(): CrossReferenceManifest | null { return this.manifest; }

  async getStorageSummary(): Promise<LibraryStorageSummary> {
    const summary = { bytes: 0, files: 0, missing: 0 };
    if (!this.manifest || !this.fileSize) return summary;
    const files = ["manifest.json", "SOURCE-LICENSE.md", ...this.manifest.books.map(book => book.code + ".json")];
    for (const file of files) {
      try {
        const bytes = await this.fileSize(file);
        if (bytes === null) summary.missing++;
        else { summary.bytes += bytes; summary.files++; }
      } catch { summary.missing++; }
    }
    return summary;
  }

  async initialize(): Promise<boolean> {
    this.manifest = null;
    this.cache.clear();
    try {
      const raw = await this.read("manifest.json");
      if (raw.length > 30000) return false;
      const data = JSON.parse(raw) as CrossReferenceManifest;
      if (data.id !== "openbible-crossrefs" || data.schemaVersion !== 1 || data.license !== "CC BY 4.0"
        || data.title !== "OpenBible Cross-References" || !/^\d{4}-\d{2}-\d{2}$/.test(data.edition)
        || !Number.isSafeInteger(data.recordCount) || data.recordCount < 1 || data.recordCount > 500000
        || !Array.isArray(data.books) || data.books.length !== 66) return false;
      if (!BOOKS.every(book => data.books.filter(item => item.code === book.vpl).length === 1)) return false;
      if (!data.books.every(book => Number.isSafeInteger(book.records) && book.records >= 0
        && Number.isSafeInteger(book.bytes) && book.bytes > 0 && book.bytes <= 2000000
        && typeof book.sha256 === "string" && /^[a-f0-9]{64}$/.test(book.sha256))) return false;
      if (data.books.reduce((total, book) => total + book.records, 0) !== data.recordCount) return false;
      this.manifest = data;
      return true;
    } catch { return false; }
  }

  private async load(ref: PassageReference): Promise<BookReferences> {
    if (!this.manifest) throw new Error("Cross-reference resource is not installed.");
    const cached = this.cache.get(ref.book.vpl);
    if (cached) { this.cache.delete(ref.book.vpl); this.cache.set(ref.book.vpl, cached); return cached; }
    try {
      const entry = this.manifest.books.find(book => book.code === ref.book.vpl);
      if (!entry) throw new Error("Unknown book");
      const raw = await this.read(entry.code + ".json");
      if (raw.length > 2000000) throw new Error("Oversized book");
      const bytes = new TextEncoder().encode(raw);
      if (bytes.length !== entry.bytes) throw new Error("Length mismatch");
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
      if (hash !== entry.sha256) throw new Error("Checksum mismatch");
      const data = JSON.parse(raw);
      if (data.code !== entry.code || !data.references || Array.isArray(data.references)
        || typeof data.references !== "object") throw new Error("Invalid book");
      const references: BookReferences = new Map();
      let count = 0;
      for (const [key, values] of Object.entries(data.references)) {
        if (!/^\d{1,3}\.\d{1,3}$/.test(key) || !Array.isArray(values) || values.length > 2000)
          throw new Error("Invalid verse references");
        parseOsis(ref.book.osis + "." + key);
        const parsed = values.map(value => {
          if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string"
            || value[0].length > 60 || !Number.isSafeInteger(value[1])) throw new Error("Invalid target");
          const reference = parseOsis(value[0]);
          if (reference.verse === undefined || referenceId(reference) !== value[0]) throw new Error("Invalid target");
          return { reference, votes: value[1] as number };
        });
        references.set(key, parsed);
        count += parsed.length;
      }
      if (count !== entry.records) throw new Error("Record count mismatch");
      this.cache.set(entry.code, references);
      while (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value!);
      return references;
    } catch {
      throw new Error("Cross-reference data for " + ref.book.name + " is unavailable or damaged.");
    }
  }

  /** Range results retain each target once, ranked by its highest source score. */
  async lookup(ref: PassageReference, limit = 12): Promise<CrossReference[]> {
    if (!this.manifest) throw new Error("Cross-reference resource is not installed.");
    if (ref.verse === undefined) return [];
    const references = await this.load(ref);
    const targets = new Map<string, CrossReference>();
    for (let verse = ref.verse; verse <= (ref.endVerse ?? ref.verse); verse++) {
      for (const target of references.get(ref.chapter + "." + verse) ?? []) {
        const key = referenceId(target.reference);
        if (!targets.has(key) || targets.get(key)!.votes < target.votes) targets.set(key, target);
      }
    }
    const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(12, Math.floor(limit))) : 12;
    return [...targets.values()].sort((a, b) => b.votes - a.votes
      || referenceId(a.reference).localeCompare(referenceId(b.reference))).slice(0, boundedLimit);
  }
}
