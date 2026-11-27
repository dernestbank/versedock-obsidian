import { beforeEach, expect, it, vi } from "vitest";
import { Notice } from "obsidian";
import type { SwordDockController } from "../src/controller";
import { citationMarkdown } from "../src/core/study-citation";
import { reopenCitation } from "../src/ui/study-citation";
import { ResourceEntryModal } from "../src/ui/resource-entry-modal";

vi.mock("obsidian", () => ({Modal:class {}, Notice:vi.fn()}));
vi.mock("../src/ui/resource-entry-modal", () => ({ResourceEntryModal:vi.fn(class { open() {} })}));
beforeEach(() => vi.clearAllMocks());

const source = "1".repeat(64);
const key = "headword (2) & notes";
function fixture(kind: string) {
  const module = {id:"local-test-module", kind, sourceSha256:source, entries:[{key:"1"}, {key}]};
  const modules = {installed:[module], load:vi.fn(async () => module)};
  const openResources = vi.fn();
  const plugin = {modules, openResources} as unknown as SwordDockController;
  const markdown = citationMarkdown("Study vault", "Local resource · entry two", {module:module.id, entry:key, source});
  const params = Object.fromEntries(new URL(markdown.slice(markdown.indexOf("](") + 2, -1)).searchParams);
  return {module, modules, openResources, plugin, params};
}

it.each(["book", "devotional", "graphics"])("reopens an exact %s entry using the saved source key", async kind => {
  const f = fixture(kind);
  await reopenCitation(f.plugin, f.params);
  expect(f.openResources).toHaveBeenCalledWith(f.module.id, key);
});

it.each(["dictionary", "commentary"])("shows only the cited %s entry", async kind => {
  const f = fixture(kind);
  await reopenCitation(f.plugin, f.params);
  expect(ResourceEntryModal).toHaveBeenCalledWith(f.plugin, f.module, f.module.entries[1]);
});

it.each(["missing module", "different source", "missing entry"])("reports a %s without opening a nearby entry", async state => {
  const f = fixture("book");
  if (state === "missing module") f.modules.installed = [];
  if (state === "different source") f.module.sourceSha256 = "2".repeat(64);
  if (state === "missing entry") f.module.entries.pop();
  await reopenCitation(f.plugin, f.params);
  expect(Notice).toHaveBeenCalledWith(expect.stringMatching(/unavailable|different source version|missing/i));
  expect(f.openResources).not.toHaveBeenCalled();
});
