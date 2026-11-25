import { describe, expect, it } from "vitest";
import {
  LIBRARY_SECTIONS,
  librarySectionElementTag,
  librarySectionForKey
} from "../src/core/library-sections";

describe("module library navigation", () => {
  it("follows the acquisition-to-installed flow order", () => {
    expect(LIBRARY_SECTIONS).toEqual(["get-started", "discover", "installed", "downloads", "import"]);
  });

  it("supports wrapped and edge keyboard navigation", () => {
    expect(librarySectionForKey("get-started", "ArrowLeft")).toBe("import");
    expect(librarySectionForKey("import", "ArrowRight")).toBe("get-started");
    expect(librarySectionForKey("installed", "Home")).toBe("get-started");
    expect(librarySectionForKey("installed", "End")).toBe("import");
    expect(librarySectionForKey("installed", "Tab")).toBeNull();
  });

  it("keeps only the selected library tab in the native tab order", () => {
    expect(librarySectionElementTag(true)).toBe("button");
    expect(librarySectionElementTag(false)).toBe("div");
  });
});
