import { Notice } from "obsidian";
import type { SwordDockController } from "../controller";
import { AnnotationModal } from "./annotation-modal";
import { textButton } from "./components";
import { paintAnnotations, selectedMarkParts } from "./reader-annotation-text";

/** A source entry can contain one rich document or several lazily appended blocks. */
export function resourceAnnotations(content: HTMLElement, plugin: SwordDockController, edition: string,
  key: string, label: string, multipleBlocks = false): () => void {
  content.addClass("vd-selectable-resource");
  if (!multipleBlocks) content.dataset.reference = "block-0";
  const selector = "[data-reference]";
  const marks = () => plugin.settings.annotations.filter(mark => mark.edition === edition && mark.resource?.key === key);
  const paint = () => {
    const records = marks();
    const blocks = multipleBlocks ? content.querySelectorAll<HTMLElement>(selector) : [content];
    for (const block of blocks) {
      for (const tag of block.querySelectorAll("mark[data-annotation-id]")) tag.replaceWith(...tag.childNodes);
      block.normalize();
      paintAnnotations(block, records, edition);
    }
  };
  const toolbar = content.parentElement!.createDiv({cls: "vd-resource-selection vd-action-row"});
  content.before(toolbar);
  const readSelection = () => {
    const selection = content.ownerDocument.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const parts = selectedMarkParts(content, range, [], selector);
    return parts.length ? {parts, text: selection.toString()} : null;
  };
  let captured: ReturnType<typeof readSelection> = null;
  toolbar.addEventListener("pointerdown", () => { captured = readSelection(); });
  const takeSelection = () => {
    const selection = readSelection() ?? captured;
    captured = null;
    if (!selection) new Notice("Select text in this resource first.");
    return selection;
  };
  textButton(toolbar, "Copy selection", () => {
    const selection = takeSelection();
    if (selection) void navigator.clipboard.writeText(selection.text)
      .then(() => new Notice("Selection copied"), () => new Notice("Could not copy the selection."));
  });
  textButton(toolbar, "Highlight selection", () => {
    const selection = takeSelection();
    if (selection) new AnnotationModal(plugin, {id: crypto.randomUUID(), edition, resource: {key, label},
      parts: selection.parts, color: "amber", style: "highlight", note: ""}, false, paint).open();
  });
  content.addEventListener("click", event => {
    if (!content.ownerDocument.getSelection()?.isCollapsed) return;
    const target = event.target instanceof content.ownerDocument.defaultView!.Element ? event.target : null;
    const markId = target?.closest("mark[data-annotation-id]")?.getAttribute("data-annotation-id");
    if (!markId || target?.closest("a")) return;
    const record = marks().find(mark => mark.id === markId);
    if (record) new AnnotationModal(plugin, record, true, paint).open();
  });
  paint();
  return paint;
}

export function strongsAnnotations(text: HTMLElement, plugin: SwordDockController, key: string): void {
  const normalized = key.toUpperCase().replace(/^([GH])0+(?=\d)/, "$1");
  resourceAnnotations(text, plugin, "strongs", normalized, "Strong’s dictionary · " + normalized);
}
