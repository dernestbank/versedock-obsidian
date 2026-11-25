import { describe, expect, it } from "vitest";
import { referenceId } from "../src/core/references";
import {
  RESOURCE_TYPES, installedDockResources, restoredResourceDockState,
  selectedDockResource, strongsMatchesDictionary, type ResourceAvailability
} from "../src/core/resource-dock";

const available: ResourceAvailability = { webp: true, kjv: true, mhc: true, strongs: true };

describe("Resources native dock", () => {
  it("offers all six resource types without inventing installed files", () => {
    expect(RESOURCE_TYPES).toEqual(["bible", "commentary", "dictionary", "book", "devotional", "graphics"]);
    expect(installedDockResources("bible", available).map(m => m.id)).toEqual(["webp", "kjv"]);
    expect(installedDockResources("commentary", available).map(m => m.id)).toEqual(["mhc"]);
    expect(installedDockResources("dictionary", available).map(m => m.id)).toEqual(["strongs-greek", "strongs-hebrew"]);
    for (const type of ["book", "devotional", "graphics"] as const) {
      expect(installedDockResources(type, available)).toEqual([]);
    }
  });

  it("excludes uninstalled resources and rejects arbitrary requested identifiers", () => {
    const absent: ResourceAvailability = { webp: true, kjv: false, mhc: false, strongs: true };
    expect(installedDockResources("bible", absent).map(m => m.id)).toEqual(["webp"]);
    expect(selectedDockResource("bible", "kjv", absent)?.id).toBe("webp");
    expect(selectedDockResource("commentary", "mhc", absent)).toBeNull();
    expect(selectedDockResource("dictionary", "malicious", absent)?.id).toBe("strongs-greek");
    expect(selectedDockResource("book", "nonexistent", absent)).toBeNull();
  });

  it("routes Strong's dictionary lookups by Greek or Hebrew identifier", () => {
    expect(strongsMatchesDictionary("strongs-greek", "G25")).toBe(true);
    expect(strongsMatchesDictionary("strongs-hebrew", "H430")).toBe(true);
    for (const code of ["H430", "G0", "G999999", "<script>", "G-12", "G1 OR 1=1"]) {
      expect(strongsMatchesDictionary("strongs-greek", code)).toBe(false);
    }
    expect(strongsMatchesDictionary("strongs-hebrew", "G25")).toBe(false);
    expect(strongsMatchesDictionary("other", "G25")).toBe(false);
  });

  it("restores independent resource, module, and pinned context", () => {
    const state = restoredResourceDockState({
      resourceType: "dictionary", moduleId: "strongs-hebrew", pinnedReference: "John.3.14-16"
    });
    expect(state.resourceType).toBe("dictionary");
    expect(state.moduleId).toBe("strongs-hebrew");
    expect(referenceId(state.pinnedReference!)).toBe("John.3.14-16");
  });

  it("falls back safely on malformed saved state", () => {
    expect(restoredResourceDockState(null)).toEqual({
      resourceType: "commentary", moduleId: null, pinnedReference: null, moduleSelections: {}, dictionaryQueries: {}
    });
    for (const invalid of [
      { resourceType: "copilot", moduleId: 3, pinnedReference: {} },
      { resourceType: "book", moduleId: "a".repeat(100), pinnedReference: "John.3.0" }
    ]) {
      const result = restoredResourceDockState(invalid);
      expect(result.moduleId).toBeNull();
      expect(result.pinnedReference).toBeNull();
      expect(RESOURCE_TYPES).toContain(result.resourceType);
    }
  });
});

it("retains per-type module choices and bounded dictionary queries across reload", () => {
  const state = restoredResourceDockState({ resourceType: "dictionary", moduleId: "strongs-hebrew",
    moduleSelections: { bible: "kjv", dictionary: "strongs-hebrew", book: "uninstalled" },
    dictionaryQueries: { "strongs-greek": "G25", "strongs-hebrew": "H430", other: "bad" } });
  expect(state.moduleSelections).toEqual({ bible: "kjv", dictionary: "strongs-hebrew" });
  expect(state.dictionaryQueries).toEqual({ "strongs-greek": "G25", "strongs-hebrew": "H430" });
  expect(restoredResourceDockState({ dictionaryQueries: { "strongs-greek": "x".repeat(100) } }).dictionaryQueries).toEqual({});
});

it('retains installed headword dictionary queries without treating them as Strong’s IDs',()=>{
  const state=restoredResourceDockState({dictionaryQueries:{'mysword-eastons':'Abraham','strongs-greek':'G25',unknown:'discard'}});
  expect(state.dictionaryQueries).toEqual({'mysword-eastons':'Abraham','strongs-greek':'G25'});
});
it('retains well-formed local module choices and dictionary queries until checked against installed inventory',()=>{
 const id='local-dictionary-'+ 'a'.repeat(24);
 const state=restoredResourceDockState({moduleSelections:{dictionary:id,bible:id},dictionaryQueries:{[id]:'Faith'}});
 expect(state.moduleSelections).toEqual({dictionary:id});expect(state.dictionaryQueries).toEqual({[id]:'Faith'});
});
