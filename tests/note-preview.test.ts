import { describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { notePreviewText, MAX_NOTE_PREVIEW_BYTES } from "../src/core/note-preview";
import { readScriptureNotePreview } from "../src/obsidian/note-preview";

describe("local note preview text", () => {
  it("skips frontmatter and empty template headings, then shows the first prose paragraph", () => {
    expect(notePreviewText('---\nprivate-key: hidden\n---\n# John 3:16\n\n## Observations\n\nGod’s love reaches the whole world.\nIt calls for trust.\n\n## Questions\nMore text.'))
      .toBe("God’s love reaches the whole world. It calls for trust.");
  });
  it("keeps link labels as plain text and excludes embeds, code fences and quoted passages", () => {
    expect(notePreviewText('# Title\n\n```js\nfetch("https://private.example")\n```\n\n> A quoted verse\n\n![[Private Note]]\n\nThe **gift** in [[Study|this study]] and [John](https://example.test) matters. ![image](https://example.test/tracker.png)'))
      .toBe("The gift in this study and John matters.");
  });
  it("does not expose an unterminated frontmatter block or invent observations from headings", () => {
    expect(notePreviewText('---\nsecret: private\nNo closing fence')).toBe("");
    expect(notePreviewText('# John 3:16\n\n## Observations\n\n## Questions\n\n## Reflections')).toBe("");
  });
  it("bounds the excerpt and leaves code points intact", () => {
    const preview = notePreviewText("A thoughtful observation. ".repeat(100));
    expect(preview.length).toBeLessThanOrEqual(181);
    expect(preview.endsWith("…")).toBe(true);
    expect(notePreviewText("🙂".repeat(250))).not.toMatch(/[\uD800-\uDBFF]$/);
  });
});

describe("bounded Obsidian note preview", () => {
  function fixture(size = 80) {
    const file = { path: "Bible Study/John/John 3-16.md", basename: "John 3-16", extension: "md", stat: { size, mtime: 1234567890000 } };
    const read = vi.fn(async () => "# John 3:16 — Love\n\nA real observation.");
    const app = { vault: { getFileByPath: vi.fn(() => file), cachedRead: read },
      metadataCache: { getFileCache: vi.fn(() => ({ headings: [{ level: 1, heading: "John 3:16 — Love" }] })) } } as unknown as App;
    return { app, read, file };
  }
  it("reads only the explicitly selected Markdown file and uses its indexed title and modification date", async () => {
    const { app, read, file } = fixture();
    expect(await readScriptureNotePreview(app, file.path)).toEqual({ state: "ready", title: "John 3:16 — Love", text: "A real observation.", modified: 1234567890000 });
    expect(read).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledWith(file);
  });
  it("skips large notes before reading their bodies", async () => {
    const { app, read, file } = fixture(MAX_NOTE_PREVIEW_BYTES + 1);
    expect((await readScriptureNotePreview(app, file.path)).state).toBe("too-large");
    expect(read).not.toHaveBeenCalled();
  });
  it("handles missing files and sanitized read failures", async () => {
    const { app, read, file } = fixture();
    read.mockRejectedValueOnce(new Error("/Users/private/Vault/secret.md"));
    const failed = await readScriptureNotePreview(app, file.path);
    expect(failed.state).toBe("unavailable");
    expect(JSON.stringify(failed)).not.toContain("private");
    vi.mocked(app.vault.getFileByPath).mockReturnValue(null);
    expect((await readScriptureNotePreview(app, file.path)).state).toBe("missing");
  });
});
