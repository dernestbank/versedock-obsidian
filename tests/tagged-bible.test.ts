import { describe, expect, it } from "vitest";
import { readFileSync, statSync } from "node:fs";
import type { App } from "obsidian";
import { OfflineBibleLibrary } from "../src/core/library";
import { StrongsLexicon } from "../src/core/lexicon";
import { parseReference } from "../src/core/references";

const app = { vault: { configDir: ".obsidian", adapter: {
  read: async (name: string) => readFileSync("library/" + name.split("/library/")[1], "utf8"),
  stat: async (name: string) => ({ type: "file", size: statSync("library/" + name.split("/library/")[1]).size })
}}} as unknown as App;

describe("source-tagged KJV study", () => {
  it('rejects an occurrence scan if the source is reinitialized while a book is loading',async()=>{
    let release:(()=>void)|undefined;
    const held={vault:{configDir:app.vault.configDir,adapter:{
      read:async(name:string)=>{if(name.endsWith('/GEN.json'))await new Promise<void>(resolve=>release=resolve);return app.vault.adapter.read(name);},
      stat:(name:string)=>app.vault.adapter.stat(name)
    }}} as unknown as App;
    const bible=new OfflineBibleLibrary(held,'versedock','kjv');await bible.initialize();
    const pending=bible.findStrongs('H430',1);
    const rejected=expect(pending).rejects.toThrow(/changed|reopen/i);
    while(!release)await new Promise(resolve=>setTimeout(resolve,0));
    await bible.initialize();release();await rejected;
  });
  it("preserves real English phrases, Greek forms, morphology and red-letter source markup", async () => {
    const bible = new OfflineBibleLibrary(app, "versedock", "kjv");
    expect(await bible.initialize()).toBe(true);
    const [verse] = await bible.getPassage(parseReference("John 3:16"));
    expect(verse.text).toContain("only begotten Son");
    expect(verse.tokens?.map(token => token.text).join("")).toBe(verse.text);
    const loved = verse.tokens?.find(token => token.text === "loved");
    expect(loved).toMatchObject({ strongs: ["G25"], lemmas: ["ηγαπησεν"], morphology: ["robinson:V-AAI-3S"], redLetter: true });
    expect(verse.text).not.toContain("<w");
    const [genesis] = await bible.getPassage(parseReference("Genesis 1:1"));
    expect(genesis.tokens?.find(token => token.text === "God")?.strongs).toEqual(["H430"]);
  });

  it("keeps source versification gaps explicit instead of duplicating a nearest verse", async () => {
    const bible = new OfflineBibleLibrary(app, "versedock", "kjv");
    await bible.initialize();
    await expect(bible.getPassage(parseReference("Romans 14:24"))).rejects.toThrow("No complete passage");
    expect((await bible.getChapter(parseReference("Romans 14"))).verses.at(-1)?.verse).toBe(23);
    expect((await bible.getPassage(parseReference("Romans 16:26-27")))).toHaveLength(2);
  });

  it("verifies all source-tagged books against their generated checksums", async () => {
    const bible = new OfflineBibleLibrary(app, "versedock", "kjv");
    await bible.initialize();
    expect((await bible.verifyIntegrity()).issues).toEqual([]);
    let count = 0;
    for (const book of bible.metadata!.books) {
      const data = JSON.parse(readFileSync("library/kjv/" + book.code + ".json", "utf8"));
      for (const chapter of data.chapters) for (const verse of chapter.verses) {
        count++;
        expect(verse.tokens.map((token: { text: string }) => token.text).join("")).toBe(verse.text);
      }
    }
    expect(count).toBe(31102);
    // This reads/checksums all 66 books and checks every verse. Allow bounded
    // CPU/I/O contention in the 2-CPU Linux runner; this is not a speed budget.
  }, 60000);

  it("rejects oversized tagged files before reading them and clears stale metadata on recheck", async () => {
    let booksRead = 0, invalidManifest = false;
    const broken = { vault: { configDir: ".obsidian", adapter: {
      stat: async () => ({ type: "file", size: 999999999 }),
      read: async (name: string) => {
        if (!name.endsWith("manifest.json")) booksRead++;
        const raw = await app.vault.adapter.read(name);
        return invalidManifest && name.endsWith("manifest.json") ? raw.replace('"code":"GEN"', '"code":"../GEN"') : raw;
      }
    }}} as unknown as App;
    const bible = new OfflineBibleLibrary(broken, "versedock", "kjv");
    expect(await bible.initialize()).toBe(true);
    await expect(bible.getPassage(parseReference("John 3:16"))).rejects.toThrow("missing or unreadable");
    expect(booksRead).toBe(0);
    invalidManifest = true;
    expect(await bible.initialize()).toBe(false);
    expect(bible.metadata).toBeNull();
  });

  it("looks up exact Greek and Hebrew keys, rejecting unknown and path-shaped keys", async () => {
    const lexicon = new StrongsLexicon(file => Promise.resolve(readFileSync("library/strongs/" + file, "utf8")));
    expect(await lexicon.initialize()).toBe(true);
    expect(await lexicon.lookup("G25")).toMatchObject({ lemma: "ἀγαπάω", transliteration: "agapao" });
    expect((await lexicon.lookup("H430"))?.text).toContain("'elohiym");
    expect(await lexicon.lookup("G99999")).toBeNull();
    await expect(lexicon.lookup("../../G25")).rejects.toThrow("Invalid Strong's identifier");
  });

  it("rejects tampered dictionary content with a sanitized error", async () => {
    const lexicon = new StrongsLexicon(file => Promise.resolve(file === "G.json" ? "{}" : readFileSync("library/strongs/" + file, "utf8")));
    await lexicon.initialize();
    await expect(lexicon.lookup("G25")).rejects.toThrow("Greek dictionary is unavailable or damaged");
  });

  it("finds bounded source-tagged occurrences without searching English lookalikes", async () => {
    let bookReads=0;
    const tracked={vault:{configDir:app.vault.configDir,adapter:{
      read:async(name:string)=>{if(!name.endsWith('/manifest.json'))bookReads++;return app.vault.adapter.read(name);},
      stat:(name:string)=>app.vault.adapter.stat(name)
    }}} as unknown as App;
    const bible = new OfflineBibleLibrary(tracked, "versedock", "kjv");
    await bible.initialize();
    const page = await bible.findStrongs("G25", 5);
    expect(page.results).toHaveLength(5);
    expect(page.truncated).toBe(true);
    expect(page.results[0].label).toBe("Matthew 5:43");
    expect(page.total).toBe(109);
    const initialReads=bookReads;
    const next = await bible.findStrongs("G25", 5, undefined, 5);
    expect(bookReads-initialReads).toBeLessThanOrEqual(1);
    expect(next.total).toBe(page.total);
    expect(next.offset).toBe(5);
    expect(next.results.some(result => page.results.some(first => first.label === result.label))).toBe(false);
    const beforeEnd=bookReads;
    const end = await bible.findStrongs("G25", 5, undefined, 10000);
    expect(bookReads).toBe(beforeEnd);
    expect(end.results).toEqual([]);
    expect(end.total).toBe(page.total);
    expect(end.truncated).toBe(false);
    await expect(bible.findStrongs("G/25", 5)).rejects.toThrow("Invalid Strong's identifier");
    const abort = new AbortController(); abort.abort();
    await expect(bible.findStrongs("G25", 5, abort.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
