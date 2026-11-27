import { resourceAnnotations } from "./resource-annotations";
import type { SwordDockController } from "../controller";
import { COMMENTARY_SOURCE, type CommentaryEntry } from "../core/commentary";
import { refLabel, type PassageReference } from "../core/references";
import { textButton } from "./components";
import {renderResourceNodes} from './resource-content';
import {ResourcePassageModal} from './resource-passage-modal';
import type {ResourceLink} from '../core/resource-links';

export function commentaryAttribution(parent: HTMLElement): void {
  const credit = parent.createDiv({ cls: "vd-commentary-credit" });
  credit.createEl("a", { text: "CrossWire · MHC 2.2", attr: { href: COMMENTARY_SOURCE, target: "_blank", rel: "noreferrer" } });
  credit.createSpan({ text: " · Public domain" });
}

function sectionReference(ref: PassageReference, entry: CommentaryEntry): PassageReference {
  return { book: ref.book, chapter: entry.chapter, verse: entry.verse,
    ...(entry.endVerse > entry.verse ? { endVerse: entry.endVerse } : {}) };
}

function renderSection(parent: HTMLElement, plugin: SwordDockController, ref: PassageReference, entry: CommentaryEntry): void {
  const section = parent.createEl("section", { cls: "vd-commentary-section" });
  const reference = sectionReference(ref, entry);
  section.createEl("h3", { text: refLabel(reference) });
  const content = section.createDiv({ cls: "vd-commentary-text" });
  const document=plugin.commentary.content(entry);
  const actions={open:(target:ResourceLink):void=>{if(target.kind==='scripture')new ResourcePassageModal(plugin,target,"Matthew Henry's Commentary · MHC 2.2").open();}};
  const label = refLabel(reference);
  const paint = resourceAnnotations(content, plugin, "mhc", label, "Matthew Henry · " + label, true);
  let position = 0;
  const more = textButton(section, "Continue reading this section", () => append(true), "vd-study-card-link");
  const append = (focus: boolean): void => {
    const page = document.blocks.slice(position, position + 20);
    let first: HTMLElement | null = null;
    for (const [index, block] of page.entries()) {
      let element: HTMLElement;
      if (block.kind === "quotation") {
        const quotation = content.createEl("details", { cls: "vd-commentary-quotation" });
        element = quotation.createEl("summary", { text: "Quoted Scripture · source edition" });
        const quoted=quotation.createEl('blockquote',{cls:'vd-rich-resource'});
        quoted.dataset.reference = "block-" + (position + index);
        if(block.nodes)renderResourceNodes(quoted,block.nodes,actions);
        else quoted.setText(block.text);
      } else {
        element = content.createEl(block.kind === "heading" ? "h4" : "p", {cls:'vd-rich-resource'});
        element.dataset.reference = "block-" + (position + index);
        if(block.nodes)renderResourceNodes(element,block.nodes,actions);
        else element.setText(block.text);
      }
      first ??= element;
    }
    position += page.length;
    paint();
    if (position >= document.blocks.length) more.remove();
    if (focus && first) {
      if (first.tagName !== "SUMMARY") first.tabIndex = -1;
      first.focus({ preventScroll: true });
    }
  };
  append(false);
  if(document.issues.length){const notes=section.createEl('details',{cls:'vd-resource-format-notice'});notes.createEl('summary',{text:document.complete?'Source formatting notes':'Rich formatting unavailable · original source retained'});for(const issue of document.issues)notes.createEl('p',{text:issue});}
  if(entry.source!==undefined){const original=section.createEl('details',{cls:'vd-retained-source'});original.createEl('summary',{text:'Original source text · OSIS'});original.createEl('pre',{text:entry.source});}
  textButton(section, "Open this passage in Reader", () => {
    plugin.selectReference(reference);
    void plugin.openReader();
  }, "vd-study-card-link");
}

export function renderCommentaryPanel(parent: HTMLElement, plugin: SwordDockController,
  ref: PassageReference, compact: boolean, more?: () => void): void {
  parent.createEl(compact ? "strong" : "h3", { text: "Matthew Henry's Commentary", cls: "vd-commentary-title" });
  const results = parent.createDiv({ cls: "vd-commentary-results", attr: { "aria-busy": "true", "aria-live": compact ? "polite" : "off" } });
  results.createEl("p", { cls: "vd-subtle", text: "Loading local commentary…", attr: { role: "status" } });
  commentaryAttribution(parent);
  if (!compact) {
    const about = parent.createEl("details", { cls: "vd-notes-discovery-help" });
    about.createEl("summary", { text: "About this commentary" });
    about.createEl("p", { text: "Matthew Henry's Complete Commentary, CrossWire edition 2.2, public domain. The source was prepared from CCEL text supplied by Logos Research. Supported source headings, emphasis, paragraphs and reference links are preserved. Numbered quotation blocks retain the source's Scripture text. Qualified citations open an edition-labelled offline preview; invalid or incomplete addresses are not inferred. Original OSIS is available for each section. Section ranges follow KJV numbering and are not remapped to WEB. A section may cover more than the selected verse." });
  }
  void (async () => {
    try {
      const entries = await plugin.commentary.lookup(ref);
      if (!results.isConnected) return;
      results.empty();
      if (!entries.length) {
        results.createEl("p", { text: "No commentary entry for " + refLabel(ref) + " in this edition." });
        return;
      }
      if (compact) {
        const entry = entries[0];
        results.createDiv({ cls: "vd-study-card-reference", text: refLabel(sectionReference(ref, entry)) });
        const document=plugin.commentary.content(entry);
        const excerpt = document.blocks.find(block => block.kind === "paragraph")?.text ?? document.blocks[0]?.text ?? 'Rich formatting is unavailable. Open the complete original source.';
        const wrapper = results.createDiv();
        const paragraph = wrapper.createEl("p", {cls: "vd-commentary-excerpt"});
        const blockIndex = Math.max(0, document.blocks.findIndex(block => block.kind === "paragraph"));
        paragraph.dataset.reference = "block-" + blockIndex;
        paragraph.setText(excerpt.length > 320 ? excerpt.slice(0, 320).replace(/\s+\S*$/, "") : excerpt);
        if (excerpt.length > 320) paragraph.after("…");
        const label = refLabel(sectionReference(ref, entry));
        resourceAnnotations(wrapper, plugin, "mhc", label, "Matthew Henry · " + label, true);
        if (entries.length > 1) results.createDiv({ cls: "vd-subtle vd-commentary-count", text: entries.length + " sections cover this selection" });
        if (more) textButton(results, "Read more", more, "vd-study-card-link");
      } else {
        const sections = results.createDiv({ cls: "vd-commentary-sections" });
        let position = 0;
        const next = textButton(results, "More sections", () => append(true), "vd-study-card-link");
        const append = (focus: boolean): void => {
          const page = entries.slice(position, position + 2);
          const firstNew = sections.children.length;
          for (const entry of page) renderSection(sections, plugin, ref, entry);
          position += page.length;
          if (position >= entries.length) next.remove();
          else next.setText("More sections · " + (entries.length - position) + " remaining");
          if (focus) {
            const first = sections.children[firstNew] as HTMLElement | undefined;
            if (first) { first.tabIndex = -1; first.focus({ preventScroll: true }); }
          }
        };
        append(false);
      }
    } catch (error) {
      if (!results.isConnected) return;
      results.setText(error instanceof Error ? error.message : "Local commentary unavailable.");
      textButton(results, "Open Module Library", () => { void plugin.openLibrary(); }, "vd-study-card-link");
    } finally { results.setAttribute("aria-busy", "false"); }
  })();
}
