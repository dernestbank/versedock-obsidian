import { Modal } from "obsidian";
import type { SwordDockController } from "../controller";
import { textButton } from "./components";

export class WorkspaceHelpModal extends Modal {
  constructor(private readonly plugin: SwordDockController) { super(plugin.app); }
  onOpen(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-workspace-help");
    root.createEl("h2", { text: "Your Bible study workspace" });
    root.createEl("p", { cls: "vd-subtle", text: "Navigate from the left dock, read in the center and keep passage tools beside you in the right Study dock." });
    const topics = [
      ["Read & navigate", "Choose a book or chapter in the Reader toolbar, or use Quick Jump for a reference such as John 3:16-18. Use [ and ] to change chapters; J and K move between verses."],
      ["Select & annotate", "Click a verse or focus it and press Enter. Hold Shift while clicking or pressing Enter to extend a range. Shift+J and Shift+K extend a range from its edges. Copy, Note and Bookmark are on the selected passage; More contains insertion and highlighting."],
      ["Study alongside Scripture", "The Study dock follows the Reader. Click Follow to pin it to the current passage; click Pinned to follow the Reader again. Expand Commentary, Cross-References and My Notes as needed. Collapsed sections, selected tab and pinned passage survive reloads."],
      ["Keep your notes", "Passage notes are ordinary Markdown files in your vault. My Notes discovers Scripture frontmatter and backlinks to the primary note. Change the destination for new notes in Settings."],
      ["Shape your workspace", "Drag Obsidian's dividers to resize the docks. In Appearance, choose Classic, Compact study or Focus. Compact study tightens verse spacing while preserving your typography. Exit Focus to return to the previous layout, including after a reload. Open Study Desk to reveal both docks again."],
      ["Installed resources", "This build includes WEB, tagged KJV, Strong’s Greek and Hebrew dictionaries, OpenBible cross-references and Matthew Henry's Commentary. Change Bible editions in the Reader toolbar. Preview bundled KJV words with the pointer; click or press Enter to pin one in Instant Details. Left/Right moves between words. Word, Lexicon and Occurrences tabs show grammar, definitions and paged tagged-verse results. Unpin clears the word. Module Library can install supported publisher resources or preview and import compatible local SQLite/gzip files. Resources keeps books, devotionals, maps, installed commentary and dictionary lookups beside the Reader."]
    ];
    for (const [title, text] of topics) {
      const section = root.createEl("section");
      section.createEl("h3", { text: title });
      section.createEl("p", { text });
    }
    const actions = root.createDiv({ cls: "vd-action-row" });
    textButton(actions, "Open Study Desk", () => { this.close(); void this.plugin.openStudyDesk(); }, "mod-cta");
    textButton(actions, "Settings", () => { this.close(); this.plugin.openWorkspaceSettings(); });
    textButton(actions, "Close", () => this.close());
  }
  onClose(): void { this.contentEl.empty(); }
}
