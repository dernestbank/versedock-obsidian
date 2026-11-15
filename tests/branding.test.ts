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
    expect(manifest.version).toBe(json("package.json").version);
    expect(json("versions.json")).toHaveProperty(String(manifest.version));
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

  it("keeps hidden search controls out of the flex layout", () => {
    const styles = readFileSync(path.join(root, "styles.css"), "utf8");
    expect(styles).toMatch(/\.versedock \.vd-search-filter-row label\[hidden\]\s*\{\s*display:\s*none;\s*\}/u);
  });

  it("keeps visible compact-reader controls at least 44 by 44 pixels", () => {
    const styles = readFileSync(path.join(root, "styles.css"), "utf8");
    expect(styles).toMatch(/body\.is-mobile \.versedock \.vd-icon-button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/u);
    expect(styles).toMatch(/\.vd-toolbar-nav \.vd-text-button\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/u);
    expect(styles).toMatch(/aria-label="Quick Jump"[^}]*aria-label="Focus Mode"[^}]*display:\s*none;/u);
  });
});
