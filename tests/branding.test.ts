import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const json = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path.join(root, file), "utf8")) as Record<string, unknown>;

describe("SwordDock Bible branding and compatibility", () => {
  it("uses the chosen display name without changing the installed plugin ID", () => {
    const manifest = json("manifest.json");
    expect(manifest.name).toBe("SwordDock Bible");
    expect(manifest.id).toBe("versedock");
    expect(manifest.version).toBe("0.1.0");
  });

  it("uses the corresponding private development package name", () => {
    expect(json("package.json").name).toBe("sworddock-bible");
    expect(json("package-lock.json").name).toBe("sworddock-bible");
  });

  it("does not show retired branding in current plugin UI source", () => {
    for (const filename of [
      "src/main.ts", "src/ui/reader-view.ts", "src/ui/inspector-view.ts",
      "src/ui/library-view.ts", "src/ui/search-view.ts"
    ]) {
      const content = readFileSync(path.join(root, filename), "utf8");
      expect(content).not.toMatch(/VerseDock|MySwordPlus/);
    }
  });
});
