import type { LibraryStorageSummary } from "./library";

export interface LexiconEntry { lemma: string; transliteration: string; text: string }
interface LexiconFile { file: "G.json" | "H.json"; entries: number; bytes: number; sha256: string }
interface LexiconManifest { id: "strongs"; schemaVersion: 1; license: "Public Domain"; files: LexiconFile[] }

/** Two fixed, inert data files; arbitrary source paths and HTML are never accepted. */
export class StrongsLexicon {
  private manifest: LexiconManifest | null = null;
  private cache = new Map<string, Record<string, LexiconEntry>>();
  constructor(private readonly read: (file: string) => Promise<string>, private readonly size?: (file: string) => Promise<number | null>) {}
  get metadata(): LexiconManifest | null { return this.manifest; }
  async initialize(): Promise<boolean> {
    this.manifest = null; this.cache.clear();
    try {
      const raw = await this.read("manifest.json");
      if (raw.length > 10000) return false;
      const data = JSON.parse(raw) as LexiconManifest;
      if (data.id !== "strongs" || data.schemaVersion !== 1 || data.license !== "Public Domain"
        || !Array.isArray(data.files) || data.files.length !== 2
        || !["G.json", "H.json"].every(file => data.files.filter(entry => entry.file === file).length === 1)
        || !data.files.every(file => Number.isSafeInteger(file.entries) && file.entries > 0 && file.entries < 9000
          && Number.isSafeInteger(file.bytes) && file.bytes > 0 && file.bytes <= 5000000 && /^[a-f0-9]{64}$/.test(file.sha256))) return false;
      this.manifest = data; return true;
    } catch { return false; }
  }
  async lookup(key: string): Promise<LexiconEntry | null> {
    if (!/^[GH][1-9][0-9]{0,4}$/.test(key)) throw new Error("Invalid Strong's identifier.");
    if (!this.manifest) throw new Error("Strong's dictionaries are not installed.");
    const file = key[0] + ".json";
    try {
      let data = this.cache.get(file);
      if (!data) {
        const expected = this.manifest.files.find(entry => entry.file === file)!;
        if (this.size && await this.size(file) !== expected.bytes) throw new Error("Length mismatch");
        const raw = await this.read(file);
        if (raw.length > 5000000) throw new Error("Oversized dictionary");
        const bytes = new TextEncoder().encode(raw);
        const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
        const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
        if (bytes.length !== expected.bytes || hash !== expected.sha256) throw new Error("Checksum mismatch");
        const parsed = JSON.parse(raw) as Record<string, LexiconEntry>;
        if (Object.keys(parsed).length !== expected.entries || !Object.entries(parsed).every(([id, entry]) =>
          new RegExp("^" + key[0] + "[1-9][0-9]{0,4}$").test(id) && entry
          && [entry.lemma, entry.transliteration, entry.text].every(text => typeof text === "string" && text.length <= 30000)
          && entry.text.length > 0)) throw new Error("Invalid entries");
        data = parsed; this.cache.set(file, data);
      }
      return Object.hasOwn(data, key) ? data[key] : null;
    } catch { throw new Error((key[0] === "G" ? "Greek" : "Hebrew") + " dictionary is unavailable or damaged."); }
  }
  async getStorageSummary(): Promise<LibraryStorageSummary> {
    const result = { bytes: 0, files: 0, missing: 0 };
    if (!this.manifest || !this.size) return result;
    for (const file of ["manifest.json", "SOURCE-LICENSE.md", "G.json", "H.json"]) {
      try { const bytes = await this.size(file); if (bytes === null) result.missing++; else { result.bytes += bytes; result.files++; } }
      catch { result.missing++; }
    }
    return result;
  }
}
