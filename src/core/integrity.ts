/** Offline WEB file integrity checks, independent of Obsidian and Node APIs. */
export interface BookFingerprint {
  code: string; chapters: number; verses: number; bytes: number; sha256: string;
}
export interface IntegrityIssue { code: string; problem: string }
export interface IntegrityReport {
  checked: number; total: number; issues: IntegrityIssue[];
}
export async function checkBookIntegrity(expected: BookFingerprint, raw: string): Promise<string[]> {
  const issues: string[] = [];
  // The upstream pack generator records the canonical JSON bytes, excluding its final newline.
  const canonical = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  const encoded = new TextEncoder().encode(canonical);
  if (encoded.byteLength !== expected.bytes) issues.push("File size does not match manifest");
  if (!globalThis.crypto?.subtle) {
    issues.push("SHA-256 verification is unavailable on this platform");
  } else {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    const sha = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
    if (sha !== expected.sha256.toLowerCase()) issues.push("SHA-256 checksum mismatch");
  }
  try {
    const data: unknown = JSON.parse(raw);
    if (data === null || typeof data !== "object" || !("code" in data) ||
        !("chapters" in data) || !Array.isArray(data.chapters)) {
      issues.push("Invalid Bible book structure");
    } else {
      const book = data as { code: unknown; chapters: unknown[] };
      if (book.code !== expected.code || book.chapters.length !== expected.chapters)
        issues.push("Book code or chapter count mismatch");
      let verses = 0;
      for (const chapter of book.chapters) {
        if (!chapter || typeof chapter !== "object" ||
            !("verses" in chapter) || !Array.isArray(chapter.verses)) {
          issues.push("Invalid chapter structure"); break;
        }
        verses += chapter.verses.length;
      }
      if (verses !== expected.verses) issues.push("Verse count mismatch");
    }
  } catch {
    issues.push("Invalid JSON");
  }
  return issues;
}
