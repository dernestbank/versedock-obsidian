import { Modal } from "obsidian";
import type { SwordDockController } from "../controller";
import type { WordSelection } from "../core/word-study";
import { renderWordStudy } from "./word-study-panel";
import { textButton } from "./components";

/** An explicit source-word context; opening it never changes the Reader's edition or passage. */
export class WordStudyModal extends Modal {
  private cancel: (() => void) | null = null;
  constructor(private readonly plugin: SwordDockController, private readonly word: WordSelection) { super(plugin.app); }
  onOpen(): void {
    const root = this.contentEl;
    root.empty(); root.addClass("versedock", "vd-word-study-modal");
    root.createEl("h2", { text: "KJV word study" });
    this.cancel = renderWordStudy(root.createDiv(), this.plugin, false, this.word);
    textButton(root.createDiv({ cls: "vd-action-row" }), "Close", () => this.close());
  }
  onClose(): void {
    this.cancel?.(); this.cancel = null;
    this.contentEl.empty();
  }
}
