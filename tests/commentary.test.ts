import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { CommentaryLibrary } from "../src/core/commentary";
import { parseReference } from "../src/core/references";
import { BOOKS } from "../src/core/books";

const folder = path.resolve("library/mhc");
const read = async (file: string) => readFileSync(path.join(folder, file), "utf8");

describe("offline Matthew Henry commentary", () => {
  it("resolves John 3:16 to its actual source section without inventing a verse-specific entry", async () => {
    const library = new CommentaryLibrary(read);
    expect(await library.initialize()).toBe(true);
    const entries = await library.lookup(parseReference("John 3:16"));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ chapter: 3, verse: 1, endVerse: 21 });
    expect(entries[0].source).toContain('<hi type="italic">');
    const content=library.content(entries[0]);
    expect(content.blocks.some(block => block.text.includes("God so loved the world"))).toBe(true);
    expect(content.blocks.some(block => block.kind === "paragraph")).toBe(true);
    expect(content.complete).toBe(true);
  });

  it("returns both overlapping sections once when a selection spans their boundary", async () => {
    const library = new CommentaryLibrary(read);
    await library.initialize();
    expect((await library.lookup(parseReference("John 3:20-24"))).map(entry => entry.verse)).toEqual([1, 22]);
    expect((await library.lookup(parseReference("John 3"))).map(entry => entry.verse)).toEqual([1, 22]);
    expect(await library.lookup(parseReference("John 3:99"))).toEqual([]);
  });

  it("reports missing or tampered files without exposing adapter paths", async () => {
    for (const damaged of [false, true]) {
      const library = new CommentaryLibrary(async file => {
        if (file !== "JOH.json") return read(file);
        if (damaged) return (await read(file)) + " ";
        throw new Error("/Users/private/Commentary/JOH.json missing");
      });
      await library.initialize();
      await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow(
        "Commentary data for John is unavailable or damaged.");
    }
  });

  it("clears cached content when the manifest becomes invalid", async () => {
    let invalid = false;
    const library = new CommentaryLibrary(async file => invalid ? "{}" : read(file));
    await library.initialize();
    await library.lookup(parseReference("John 3:16"));
    invalid = true;
    expect(await library.initialize()).toBe(false);
    expect(library.metadata).toBeNull();
    await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow("not installed");
  });

  it("refuses an oversized installed file before reading it", async () => {
    let bookRead = false;
    const library = new CommentaryLibrary(async file => {
      if (file === "JOH.json") { bookRead = true; throw new Error("Unexpected oversized read"); }
      return read(file);
    }, async () => 2000000000);
    await library.initialize();
    await expect(library.lookup(parseReference("John 3:16"))).rejects.toThrow("unavailable or damaged");
    expect(bookRead).toBe(false);
  });

  it("ships verified exact OSIS with ranges present in the local Bible", () => {
    const manifest = JSON.parse(readFileSync(path.join(folder, "manifest.json"), "utf8"));
    let count = 0, coveredVerses = 0;
    for (const book of BOOKS) {
      const entry = manifest.books.find((entry: { code: string }) => entry.code === book.vpl);
      const raw = readFileSync(path.join(folder, book.vpl + ".json"));
      expect(raw.byteLength).toBe(entry.bytes);
      expect(createHash("sha256").update(raw).digest("hex")).toBe(entry.sha256);
      const commentary = JSON.parse(raw.toString());
      const bible = JSON.parse(readFileSync(path.resolve("library/webp", book.vpl + ".json"), "utf8"));
      for (const section of commentary.entries) {
        const chapter = bible.chapters.find((chapter: { chapter: number }) => chapter.chapter === section.chapter);
        const verses = new Set(chapter.verses.map((verse: { verse: number }) => verse.verse));
        for (let verse = section.verse; verse <= section.endVerse; verse++)
          if (!verses.has(verse)) throw new Error("Unavailable coordinate in " + book.osis);
        coveredVerses += section.endVerse - section.verse + 1;
        expect(typeof section.source).toBe('string');
        expect(section.source.length).toBeGreaterThan(0);
        expect(section.source.length).toBeLessThanOrEqual(1024*1024);
        expect(section.blocks).toBeUndefined();
      }
      expect(commentary.entries).toHaveLength(entry.entries);
      count += commentary.entries.length;
    }
    expect(count).toBe(manifest.entryCount);
    expect(manifest.license).toBe("Public Domain");
    expect(manifest.conversion.coveredVerses).toBeGreaterThan(30000);
    expect(manifest.conversion.coveredVerses).toBe(coveredVerses);
    expect(coveredVerses + manifest.omissions.unavailableCoordinates.length + manifest.omissions.versesWithoutCommentary.length).toBe(31103);
  });

  it("reports missing files when measuring the bundled commentary", async () => {
    const library = new CommentaryLibrary(read, async file => file === "JOH.json" ? null : 10);
    await library.initialize();
    expect(await library.getStorageSummary()).toEqual({ files: 67, bytes: 670, missing: 1 });
  });

  it('keeps legacy plain assets readable and rejects same-length source tampering',async()=>{
    const current=JSON.parse(await read('manifest.json'));
    const oldBook={code:'JOH',entries:[{chapter:3,verse:1,endVerse:21,blocks:[{kind:'paragraph',text:'Legacy complete words.',nodes:[{type:'element',tag:'script',children:[{type:'text',text:'bad()'}]}]}]}]};
    const raw=JSON.stringify(oldBook);const manifest={...current,schemaVersion:1,entryCount:current.entryCount-current.books.find((b:{code:string})=>b.code==='JOH').entries+1,books:current.books.map((b:{code:string})=>b.code==='JOH'?{code:'JOH',entries:1,bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex')}:b)};
    const legacy=new CommentaryLibrary(async file=>file==='manifest.json'?JSON.stringify(manifest):file==='JOH.json'?raw:read(file));
    expect(await legacy.initialize()).toBe(true);
    const [entry]=await legacy.lookup(parseReference('John 3:16'));
    expect(legacy.content(entry).blocks[0].text).toBe('Legacy complete words.');
    expect(legacy.content(entry).blocks[0].nodes).toBeUndefined();
    const damaged=new CommentaryLibrary(async file=>file==='JOH.json'?(await read(file)).replace('Nicodemus','Xicodemus'):read(file));
    await damaged.initialize();await expect(damaged.lookup(parseReference('John 3:16'))).rejects.toThrow('unavailable or damaged');
  });

  it('rejects stale book reads and prevents older initialization from replacing newer metadata',async()=>{
    let finish!:()=>void,entered!:()=>void;let pending=false;
    const waiting=new Promise<void>(resolve=>entered=resolve);
    const library=new CommentaryLibrary(async file=>{const raw=await read(file);if(pending&&file==='JOH.json'){await new Promise<void>(resolve=>{finish=resolve;entered();});}return raw;});
    await library.initialize();pending=true;
    const lookup=library.lookup(parseReference('John 3:16'));
    const rejected=expect(lookup).rejects.toThrow('unavailable or damaged');await waiting;
    await library.initialize();pending=false;finish();await rejected;
    expect((await library.lookup(parseReference('John 3:16'))).length).toBe(1);
    let completeFirst!:(value:string)=>void,reads=0;
    const racing=new CommentaryLibrary(async()=>++reads===1?new Promise<string>(resolve=>completeFirst=resolve):'{}');
    const first=racing.initialize();expect(await racing.initialize()).toBe(false);
    completeFirst(await read('manifest.json'));expect(await first).toBe(false);expect(racing.metadata).toBeNull();
  });
});
