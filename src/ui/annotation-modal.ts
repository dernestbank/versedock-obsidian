import { Modal, Notice } from "obsidian";
import type { SwordDockController } from "../controller";
import { annotationReference, MARK_COLORS, type ReaderAnnotation } from "../core/annotations";
import { refLabel } from "../core/references";
import { textButton } from "./components";

export class AnnotationModal extends Modal {
  constructor(private readonly plugin: SwordDockController, private readonly mark: ReaderAnnotation,
    private readonly existing = false, private readonly afterSave?: () => void) { super(plugin.app); }

  onOpen(): void {
    const root = this.contentEl;
    root.addClass("versedock", "vd-annotation-editor");
    root.createEl("h2", {text: this.existing ? "Edit annotation" : this.mark.resource ? "Mark resource text" : "Mark Scripture"});
    root.createEl("strong", {text: this.mark.resource?.label ?? refLabel(annotationReference(this.mark))});
    root.createEl("blockquote", {text: this.mark.parts.map(part => part.quote).join(" ")});
    const controls = root.createDiv({cls: "vd-action-row"});
    const color = controls.createEl("label", {text: "Color "}).createEl("select", {attr: {"aria-label": "Color"}});
    for (const value of MARK_COLORS) color.createEl("option", {value, text: value[0].toUpperCase() + value.slice(1)});
    color.value = this.mark.color;
    const style = controls.createEl("label", {text: "Mark style "}).createEl("select", {attr: {"aria-label": "Mark style"}});
    style.createEl("option", {value: "highlight", text: "Highlight"});
    style.createEl("option", {value: "underline", text: "Underline"});
    style.value = this.mark.style;
    const note = root.createEl("label", {text: "Annotation (optional)"}).createEl("textarea", {attr: {rows: "3"}});
    note.value = this.mark.note;
    const actions = root.createDiv({cls:"vd-action-row"});
    let busy = false;
    const apply = async (replacement: ReaderAnnotation | null) => {
      if (busy) return;
      busy = true;
      try {
        await this.plugin.changeAnnotation(this.existing ? this.mark : null, replacement);
        this.close();
        this.afterSave?.();
        new Notice(replacement ? "Annotation saved" : "Annotation removed");
      } catch (error) {
        busy = false;
        new Notice(error instanceof Error ? error.message : "Could not save the annotation.");
      }
    };
    textButton(actions, "Save mark", () => void apply({...this.mark, color: color.value as ReaderAnnotation["color"],
      style: style.value as ReaderAnnotation["style"], note: note.value.trim()}), "mod-cta");
    if (this.existing) textButton(actions, "Remove mark", () => void apply(null));
    textButton(actions, "Cancel", () => this.close());
  }
  onClose(): void { this.contentEl.empty(); }
}
