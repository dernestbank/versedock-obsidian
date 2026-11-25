import { describe, expect, it } from "vitest";
import { EXTERNAL_RESOURCE_SOURCES } from "../src/core/resource-sources";

describe("external resource sources", () => {
  it("keeps named external sources distinct from plugin-integrated catalogs", () => {
    expect(EXTERNAL_RESOURCE_SOURCES).toHaveLength(3);
    expect(EXTERNAL_RESOURCE_SOURCES.map(source => source.domain)).toEqual([
      "mysword.info",
      "biblesupport.com",
      "doctordavet.com"
    ]);
    expect(EXTERNAL_RESOURCE_SOURCES.every(source => source.kind === "external-site")).toBe(true);
    expect(EXTERNAL_RESOURCE_SOURCES.every(source => /^https:\/\//.test(source.url))).toBe(true);
  });
});
