import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkBookIntegrity } from "../src/core/integrity";
const root = path.resolve("library/webp");
const manifest = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"));
const gen = manifest.books[0];
const content = readFileSync(path.join(root, "GEN.json"), "utf8");

describe("offline Bible integrity", () => {
  it("accepts an exact approved WEB book", async () => {
    expect(await checkBookIntegrity(gen, content)).toEqual([]);
  });
  it("detects altered verse content", async () => {
    const modified = content.replace("In the beginning", "At the beginning");
    const issues = await checkBookIntegrity(gen, modified);
    expect(issues).toContain("SHA-256 checksum mismatch");
  });
  it("detects truncated and malformed book data", async () => {
    const issues = await checkBookIntegrity(gen, '{"code":"GEN","chapters":[]}');
    expect(issues).toContain("Book code or chapter count mismatch");
    expect(issues).toContain("Verse count mismatch");
    expect(issues).toContain("SHA-256 checksum mismatch");
  });
});
