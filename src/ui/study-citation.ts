import { MarkdownView, Modal, Notice, type Plugin } from "obsidian";
import type { SwordDockController } from "../controller";
import { CITATION_ACTION, citationMarkdown, parseCitationAddress, type CitationAddress } from "../core/study-citation";
import { captureInsertionSnapshot, insertAtSnapshot } from "../core/insertion";
import { parseOsis } from "../core/references";
import { strongsMatchesDictionary } from "../core/resource-dock";
import { renderCommentarySection } from "./commentary-panel";
import { ResourceEntryModal } from "./resource-entry-modal";
import { textButton } from "./components";
import { ResourcePassageModal } from "./resource-passage-modal";
import { BOOKS } from "../core/books";

class CitationModal extends Modal {
  constructor(plugin: SwordDockController, private title: string, private render: (root: HTMLElement) => void) {
    super(plugin.app);
  }
  onOpen() {
    this.contentEl.addClass("versedock", "vd-citation-modal");
    this.contentEl.createEl("h2", {text:this.title});
    this.render(this.contentEl);
  }
  onClose() { this.contentEl.empty(); }
}

export function insertCitation(plugin: SwordDockController, label: string, address: CitationAddress) {
  const workspace = plugin.app.workspace;
  const view = workspace.getActiveViewOfType(MarkdownView) ?? workspace.getMostRecentLeaf()?.view;
  const target = view instanceof MarkdownView && view.getMode() === "source" ? view : null;
  const file = target?.file;
  const snapshot = target && captureInsertionSnapshot(target.editor);
  const markdown = citationMarkdown(plugin.app.vault.getName(), label, address);
  const modal = new CitationModal(plugin, "Insert resource citation", root => {
    root.createEl("p", {text:label});
    const actions = root.createDiv({cls:"vd-action-row"});
    if (target && snapshot && file) {
      textButton(actions, "Insert into " + file.basename, () => {
        if (target.file !== file || target.getMode() !== "source" || !workspace.getLeavesOfType("markdown").some(leaf => leaf.view === target)
          || !insertAtSnapshot(target.editor, snapshot, markdown, "inline")) {
          new Notice("The note or selection changed. Choose the insertion point again."); return;
        }
        modal.close();
        workspace.setActiveLeaf(target.leaf, {focus:true});
        target.editor.focus();
      }, "mod-cta");
    } else root.createEl("p", {cls:"vd-subtle", text:"Open a Markdown note in editing view to insert at its cursor."});
    textButton(actions, "Copy Markdown citation", () => {
      void navigator.clipboard.writeText(markdown).then(() => { modal.close(); new Notice("Citation copied."); },
        () => new Notice("Could not copy the citation."));
    });
  });
  modal.open();
}

export function registerCitationLinks(plugin: Plugin & SwordDockController) {
  plugin.registerObsidianProtocolHandler(CITATION_ACTION, params => { void reopenCitation(plugin, params); });
  // Keep same-vault Markdown links in the window that contains the note. Other
  // vaults and links opened outside the note use Obsidian's normal URI routing.
  const bind = (doc: Document) => plugin.registerDomEvent(doc, "click", event => {
    const link = (event.target as Element | null)?.closest?.('a[href^="obsidian://sworddock-cite?"]');
    if (!link || !link.closest(".markdown-rendered, .markdown-source-view")) return;
    const params = new URL(link.getAttribute("href")!).searchParams;
    if (params.get("vault") !== plugin.app.vault.getName()) return;
    event.preventDefault();
    event.stopPropagation();
    void reopenCitation(plugin, Object.fromEntries(params));
  }, {capture:true});
  const documents = new Set([document]);
  plugin.app.workspace.iterateAllLeaves(leaf => documents.add(leaf.view.containerEl.ownerDocument));
  for (const doc of documents) bind(doc);
  plugin.registerEvent(plugin.app.workspace.on("window-open", (_workspace, win) => bind(win.document)));
}

export async function reopenCitation(plugin: SwordDockController, params: Record<string,string>) {
  const address = parseCitationAddress(params);
  try {
    if (!address) throw Error("This SwordDock citation has an invalid source address.");
    const {module:id, entry:key, source} = address;
    if (id === "mhc") {
      const ref = parseOsis(key);
      const entries = (await plugin.commentary.lookup(ref)).filter(e => e.verse === ref.verse && e.endVerse === (ref.endVerse ?? ref.verse));
      if (entries.length !== 1) throw Error("This Matthew Henry commentary section is unavailable. Check Module Library.");
      new CitationModal(plugin, "Matthew Henry’s Commentary · MHC 2.2", root => renderCommentarySection(root, plugin, ref, entries[0])).open();
      return;
    }
    if (strongsMatchesDictionary(id, key)) {
      const entry = await plugin.lexicon.lookup(key);
      if (!entry) throw Error("This Strong’s dictionary entry is unavailable.");
      new CitationModal(plugin, "Strong’s " + key + " · " + entry.lemma, root => {
        root.createEl("p", {cls:"vd-subtle", text:entry.transliteration});
        root.createEl("p", {text:entry.text});
      }).open();
      return;
    }
    const installed = plugin.modules.installed.find(info => info.id === id);
    if (installed && installed.sourceSha256 !== source)
      throw Error("This citation belongs to a different source version. Restore the cited version in Module Library.");
    if (installed?.kind === "bible" || id === "webp" || id === "kjv") {
      const ref = parseOsis(key), book = BOOKS.indexOf(ref.book) + 1;
      const start = {book, chapter:ref.chapter, verse:ref.verse};
      const range = {start, ...(ref.endVerse ? {end:{...start, verse:ref.endVerse}} : {})};
      const bible = await plugin.getBibleResource(id);
      if (!bible?.metadata || bible.edition !== id)
        throw Error("The cited Bible " + id + " is unavailable. Restore it in Module Library.");
      if (installed && plugin.modules.installed.find(info => info.id === id)?.sourceSha256 !== source)
        throw Error("This citation belongs to a different source version. Restore the cited version in Module Library.");
      new ResourcePassageModal(plugin, {kind:"scripture", edition:id, range}, "study note", bible).open();
      return;
    }
    if (!installed) throw Error("The cited module " + id + " is unavailable. Restore it in Module Library to reopen this entry.");
    const module = await plugin.modules.load(id);
    if (module.sourceSha256 !== source) throw Error("This citation belongs to a different source version. Restore the cited version in Module Library.");
    const entries = module.entries.filter(e => e.key === key);
    if (entries.length !== 1) throw Error("The cited entry is missing or ambiguous in this resource.");
    if (["graphics","book","devotional"].includes(module.kind)) await plugin.openResources(id, key);
    else new ResourceEntryModal(plugin, module, entries[0]).open();
  } catch (error) { new Notice(error instanceof Error ? error.message : "The cited entry could not be opened."); }
}
