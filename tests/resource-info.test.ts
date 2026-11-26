import { describe, expect, it } from "vitest";
import { resourceInfoRows } from "../src/core/resource-info";

describe("resource info rows", () => {
  it("formats manifest provenance into stable labeled rows", () => {
    const manifest = {
      id: "webp", abbreviation: "WEB", title: "World English Bible",
      edition: "ENGWEBP stable", language: "en", license: "Public Domain",
      licenseNotice: "Trademark notice", source: "https://example.test/source",
      sourcePage: "https://example.test/details", sourceSha256: "abc123",
      verseCount: 31103, books: Array.from({ length: 66 }, (_, index) => ({
        code: String(index), chapters: 1, verses: 1, bytes: 1, sha256: "x"
      }))
    };
    const rows = resourceInfoRows(manifest);
    expect(rows).toEqual([
      { label: "Title", value: "World English Bible" },
      { label: "Edition", value: "ENGWEBP stable" },
      { label: "Language", value: "en" },
      { label: "Coverage", value: "66 books · 31,103 verses" },
      { label: "License", value: "Public Domain" },
      { label: "Source", value: "https://example.test/details", href: "https://example.test/details" },
      { label: "Source checksum", value: "abc123" }
    ]);
    expect(resourceInfoRows({...manifest,sourcePage:'',source:'Local file · owned.sqlite'}).find(row=>row.label==='Source'))
      .toEqual({label:'Source',value:'Local file · owned.sqlite'});
  });
});
