import { describe, expect, it } from "vitest";
import { SOURCE_MODULE_CANDIDATES, sourceCandidates } from "../src/core/source-catalogue";
import { RESOURCE_TYPES } from "../src/core/resource-dock";

describe("preloaded publisher source catalogue", () => {
  it("covers all six MySword categories without conflating file type and resource type", () => {
    expect(new Set(SOURCE_MODULE_CANDIDATES.map(candidate => candidate.type)))
      .toEqual(new Set(RESOURCE_TYPES));
    expect(sourceCandidates("graphics", "")[0]?.container).toMatch(/Book container/);
    expect(sourceCandidates("devotional", "")[0]?.container).toMatch(/Book container/);
  });

  it("filters by category, title, publisher and container independently", () => {
    expect(sourceCandidates("all", "").length).toBeGreaterThanOrEqual(6);
    expect(sourceCandidates("bible", "KJV").map(candidate => candidate.id)).toEqual(["mysword-kjv"]);
    expect(sourceCandidates("dictionary", "atlas")).toEqual([]);
    expect(sourceCandidates("graphics", "maps")).toHaveLength(1);
    expect(sourceCandidates("all", "Spurgeon")).toHaveLength(2);
  });

  it("includes only HTTPS publisher-hosted direct downloads and no invented install routes", () => {
    const ids = new Set<string>();
    const urls = new Set<string>();
    for (const source of SOURCE_MODULE_CANDIDATES) {
      expect(source.directDownload).toMatch(/^https:\/\/mysword-bible\.info\/download\/getfile\.php\?file=/);
      expect(source.sourcePage).toMatch(/^https:\/\/www\.mysword\.info\/download-mysword\//);
      expect(source.directDownload).toMatch(/\.mybible\.gz$/);
      expect(ids.has(source.id)).toBe(false);
      expect(urls.has(source.directDownload)).toBe(false);
      ids.add(source.id); urls.add(source.directDownload);
    }
  });
});
