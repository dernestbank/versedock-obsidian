import { editorInfoField, editorLivePreviewField, HoverPopover, MarkdownRenderChild, MarkdownView, Modal, Notice, type Editor, type Plugin } from "obsidian";
import { hoverTooltip, ViewPlugin, type EditorView } from "@codemirror/view";
import { ensureSyntaxTree } from "@codemirror/language";
import type { SwordDockController } from "../controller";
import { findNoteReferences } from "../core/note-references";
import { refLabel, type PassageReference } from "../core/references";
import { textButton } from "../ui/components";

type StudyPlugin = Plugin & SwordDockController;

function referenceAt(view: EditorView, pos: number, side: number) {
  const line = view.state.doc.lineAt(pos);
  const match = findNoteReferences(line.text).find(({from, to}) =>
    pos >= line.from + from && pos <= line.from + to &&
    !(pos === line.from + from && side < 0) && !(pos === line.from + to && side > 0));
  if (!match) return null;
  const from = line.from + match.from, to = line.from + match.to;
  // Obsidian uses HyperMD token names in its CodeMirror Markdown syntax tree.
  const tree = ensureSyntaxTree(view.state, to, 30);
  if (!tree) return null;
  let plain = true;
  tree.iterate({from, to, enter(node) {
    if (node.to > from && node.from < to && /code|link|url|frontmatter|comment|math|hashtag|hmd-html/i.test(node.name))
      plain = false;
  }});
  return plain ? {from, to, ref:match.ref} : null;
}

async function renderPreview(root: HTMLElement, plugin: SwordDockController, ref: PassageReference, close: () => void) {
  root.addClass("versedock", "vd-note-verse-preview");
  const bible = plugin.readerBible;
  const heading = root.createDiv({cls:"vd-preview-heading"});
  heading.createEl("strong", {text:refLabel(ref)});
  heading.createSpan({cls:"vd-pill", text:bible.metadata?.abbreviation ?? bible.edition});
  const content = root.createDiv({cls:"vd-preview-verse", attr:{"aria-live":"polite"}});
  content.setText("Loading passage…");
  try {
    if (!bible.metadata) throw new Error("This Bible is unavailable. Check the Module Library.");
    const verses = await bible.getPassage(ref);
    content.empty();
    for (const verse of verses) {
      const line = content.createEl("p");
      line.createEl("sup", {text:verse.verse + " "});
      line.appendText(verse.text);
    }
    textButton(root, "Open in SwordDock", () => {
      if (plugin.readerBible !== bible) { new Notice("The Bible edition changed. Preview this passage again."); return; }
      close();
      plugin.selectReference(ref);
      void plugin.openReader();
    }, "mod-cta");
  } catch (error) {
    content.setText(error instanceof Error ? error.message : "Passage unavailable in this Bible.");
  }
}

class VerseModal extends Modal {
  constructor(private plugin: SwordDockController, private ref: PassageReference) { super(plugin.app); }
  onOpen() { void renderPreview(this.contentEl, this.plugin, this.ref, () => this.close()); }
  onClose() { this.contentEl.empty(); }
}

export function registerVersePreviews(plugin: StudyPlugin): void {
  const editors = new Set<EditorView>();
  plugin.registerEditorExtension([
    ViewPlugin.define(view => {
      editors.add(view);
      return { destroy() { editors.delete(view); } };
    }),
    hoverTooltip((view, pos, side) => {
      if (!plugin.settings.livePreviews || !view.state.field(editorLivePreviewField, false)) return null;
      const target = referenceAt(view, pos, side);
      if (!target) return null;
      return {pos:target.from, end:target.to, above:true, create() {
        const dom = view.dom.ownerDocument.createElement("div");
        void renderPreview(dom, plugin, target.ref, () => view.focus());
        return {dom};
      }};
    }, {hoverTime:300, hideOnChange:true})
  ]);
  plugin.addCommand({id:"preview-note-verse", name:"Preview Scripture at cursor", editorCallback:(editor: Editor) => {
    const view = [...editors].find(view => view.state.field(editorInfoField, false)?.editor === editor);
    const match = view && referenceAt(view, view.state.selection.main.head, 0);
    if (match) new VerseModal(plugin, match.ref).open();
    else new Notice("Place the cursor on a plain verse reference such as John 3:16.");
  }});

  const parent: {hoverPopover: HoverPopover | null} = {hoverPopover:null};
  const dismiss = (hover: HoverPopover | null) => {
    if (hover && "hide" in hover && typeof hover.hide === "function") hover.hide();
    else hover?.unload();
  };
  // A plugin reload can leave the Markdown section mounted. Restore its text
  // even if Obsidian has not torn down the preview leaf yet.
  const sections = new Set<() => void>();
  plugin.register(() => {
    dismiss(parent.hoverPopover);
    for (const cleanup of sections) cleanup();
  });
  plugin.registerMarkdownPostProcessor((root, ctx) => {
    if (!plugin.settings.readingPreviews || !ctx.sourcePath.endsWith(".md")) return;
    const buttons: HTMLButtonElement[] = [];
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      if (node.parentElement?.closest("a,code,pre,button,input,textarea,script,style,svg,math,.math,.internal-embed,.metadata-container,[contenteditable=true]")) continue;
      const matches = findNoteReferences(node.data);
      if (!matches.length) continue;
      const fragment = doc.createDocumentFragment();
      let offset = 0;
      for (const {from, to, ref} of matches) {
        fragment.append(node.data.slice(offset, from));
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "vd-note-reference";
        button.textContent = node.data.slice(from, to);
        button.setAttribute("aria-label", "Preview " + refLabel(ref));
        button.onclick = () => new VerseModal(plugin, ref).open();
        button.onmouseenter = () => {
          const hover = new HoverPopover(parent, button, 200);
          void renderPreview(hover.hoverEl.createDiv(), plugin, ref, () => dismiss(hover));
        };
        buttons.push(button);
        fragment.append(button);
        offset = to;
      }
      fragment.append(node.data.slice(offset));
      node.replaceWith(fragment);
    }
    if (buttons.length) {
      const child = new MarkdownRenderChild(root);
      const cleanup = () => {
        for (const button of buttons) button.replaceWith(button.textContent ?? "");
        sections.delete(cleanup);
      };
      sections.add(cleanup);
      child.register(cleanup);
      ctx.addChild(child);
    }
  });
}

export function refreshReadingPreviews(plugin: SwordDockController) {
  for (const leaf of plugin.app.workspace.getLeavesOfType("markdown"))
    if (leaf.view instanceof MarkdownView && leaf.view.getMode() === "preview") leaf.view.previewMode.rerender(true);
}
