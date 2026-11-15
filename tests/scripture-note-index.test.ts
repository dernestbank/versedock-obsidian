import { describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { parseReference } from "../src/core/references";
import {
  MAX_SCRIPTURE_NOTE_SCAN,
  legacyStudyNotePath,
  studyNotePath
} from "../src/core/scripture-notes";
import { discoverVaultScriptureNotes, resolveStudyNoteTarget } from "../src/obsidian/scripture-note-index";

interface FakeFile {
  path: string;
  basename: string;
  stat: {mtime: number};
}

describe("Obsidian Scripture-note metadata index", () => {
  it("prioritizes the primary note and bounds metadata-cache lookups", () => {
    const reference = parseReference("John 3:16");
    const primaryPath = studyNotePath(reference);
    const files: FakeFile[] = Array.from({length: MAX_SCRIPTURE_NOTE_SCAN}, (_, index) => ({
      path: `Other/Note-${index}.md`, basename: `Note-${index}`, stat: {mtime: index}
    }));
    files.push({path: primaryPath, basename: "John 3-16", stat: {mtime: 99_999}});
    Object.defineProperty(files, "find", {value: () => { throw new Error("primary note must use indexed path lookup"); }});
    let cacheLookups = 0;
    let primaryLookups = 0;
    const app = {
      vault: {
        getMarkdownFiles: () => files as unknown as TFile[],
        getFileByPath: (path: string) => {
          primaryLookups++;
          return path === primaryPath ? files.at(-1) : null;
        }
      },
      metadataCache: {getFileCache: (file: FakeFile) => {
        cacheLookups++;
        return {frontmatter: {scripture: file.path === primaryPath ? "John.3.16" : "Ps.23"}};
      }}
    } as unknown as App;

    const result = discoverVaultScriptureNotes(app, reference);

    expect(result.notes.map(note => note.path)).toEqual([primaryPath]);
    expect(result).toMatchObject({examined: MAX_SCRIPTURE_NOTE_SCAN, scanTruncated: true});
    expect(cacheLookups).toBe(MAX_SCRIPTURE_NOTE_SCAN);
    expect(primaryLookups).toBe(1);
  });

  it("uses indexed frontmatter without reading Markdown contents", () => {
    const file = {path: "Studies/Grace.md", basename: "Grace", stat: {mtime: 42}};
    const read = () => { throw new Error("raw note content must not be read"); };
    const app = {
      vault: {getMarkdownFiles: () => [file] as unknown as TFile[], getFileByPath: () => null, read},
      metadataCache: {getFileCache: () => ({frontmatter: {scripture: ["Rom.8.28", "John.3.16"]}})}
    } as unknown as App;

    const result = discoverVaultScriptureNotes(app, parseReference("John 3:16"));

    expect(result.notes).toEqual([{
      path: "Studies/Grace.md",
      basename: "Grace",
      scripture: ["Rom.8.28", "John.3.16"],
      modified: 42
    }]);
  });

  it("does not duplicate the primary note when indexed objects have different identities", () => {
    const reference = parseReference("John 3:16");
    const primary = {path: studyNotePath(reference), basename: "John 3-16", stat: {mtime: 42}};
    const app = {
      vault: {
        getMarkdownFiles: () => [primary] as unknown as TFile[],
        getFileByPath: () => ({...primary}) as unknown as TFile
      },
      metadataCache: {getFileCache: () => ({frontmatter: {scripture: "John.3.16"}})}
    } as unknown as App;

    expect(discoverVaultScriptureNotes(app, reference).notes.map(note => note.path)).toEqual([primary.path]);
  });

  it("reuses a recognized legacy generated range note", () => {
    const reference = parseReference("John 3:16-18");
    const legacyPath = legacyStudyNotePath(reference);
    const legacy = {path: legacyPath, basename: "John 3-16", stat: {mtime: 42}};
    const app = {
      vault: {
        getMarkdownFiles: () => [legacy] as unknown as TFile[],
        getFileByPath: (path: string) => path === legacyPath ? legacy as unknown as TFile : null
      },
      metadataCache: {getFileCache: () => ({
        frontmatter: {type: "scripture-study", scripture: "John.3.16"},
        headings: [{heading: "John 3:16-18", level: 1, position: {}}]
      })}
    } as unknown as App;

    expect(resolveStudyNoteTarget(app, reference)).toEqual({path: legacyPath, file: legacy});
    expect(discoverVaultScriptureNotes(app, reference).notes.map(note => note.path)).toEqual([legacyPath]);
  });

  it("does not overwrite a genuine single-verse note when creating a range note", () => {
    const reference = parseReference("John 3:16-18");
    const preferredPath = studyNotePath(reference);
    const legacyPath = legacyStudyNotePath(reference);
    const single = {path: legacyPath, basename: "John 3-16", stat: {mtime: 42}};
    const app = {
      vault: {
        getMarkdownFiles: () => [single] as unknown as TFile[],
        getFileByPath: (path: string) => path === legacyPath ? single as unknown as TFile : null
      },
      metadataCache: {getFileCache: () => ({
        frontmatter: {type: "scripture-study", scripture: "John.3.16"},
        headings: [{heading: "John 3:16", level: 1, position: {}}]
      })}
    } as unknown as App;

    expect(resolveStudyNoteTarget(app, reference)).toEqual({path: preferredPath, file: null});
  });
});
