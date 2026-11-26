import type { LibraryManifest } from "./library";

export interface ResourceInfoRow {
  label: string;
  value: string;
  href?: string;
}

/** Converts trusted manifest fields into the stable rows shared by the Inspector surface. */
export function resourceInfoRows(manifest: LibraryManifest): ResourceInfoRow[] {
  return [
    { label: "Title", value: manifest.title },
    { label: "Edition", value: manifest.edition },
    { label: "Language", value: manifest.language ?? "Not recorded" },
    { label: "Coverage", value: manifest.books.length + " books · " + manifest.verseCount.toLocaleString("en-US") + " verses" },
    { label: "License", value: manifest.license },
    { label: "Source", value: manifest.sourcePage || manifest.source, ...(manifest.sourcePage ? {href:manifest.sourcePage} : {}) },
    { label: "Source checksum", value: manifest.sourceSha256 }
  ];
}
