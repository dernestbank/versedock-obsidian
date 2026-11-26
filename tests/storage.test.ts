import { describe, expect, it } from "vitest";
import { formatStorageBytes, storageResourceRow } from "../src/core/storage";

describe("storage display", () => {
  it("formats measured byte counts for the storage surface", () => {
    expect(formatStorageBytes(0)).toBe("0 B");
    expect(formatStorageBytes(1024)).toBe("1.0 KB");
    expect(formatStorageBytes(1024 * 1024 * 4.5)).toBe("4.5 MB");
  });

  it("keeps the bundled default Bible visibly protected", () => {
    expect(storageResourceRow(true, { bytes: 4718592, files: 67, missing: 0 })).toEqual({
      title: "World English Bible",
      status: "Current default · protected",
      details: "4.5 MB · 67 files",
      canRemove: false,
      note: "Bundled resource removal is unavailable in this preview."
    });
  });

  it("does not label WEB as the current edition when KJV is selected", () => {
    expect(storageResourceRow(true, { bytes: 1, files: 67, missing: 0 }, false).status).toBe("Bundled · Offline");
  });

  it("reports an unavailable resource without enabling cleanup", () => {
    expect(storageResourceRow(false, { bytes: 0, files: 0, missing: 0 })).toEqual({
      title: "World English Bible",
      status: "Unavailable",
      details: "No installed files measured",
      canRemove: false,
      note: "Recheck the offline library before reviewing storage cleanup."
    });
  });
});
