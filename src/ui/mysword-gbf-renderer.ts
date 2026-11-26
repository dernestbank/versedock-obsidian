import type {
  GbfAnnotationEvent,
  GbfFormatEvent,
  GbfSemanticDocument,
  GbfTextFormat
} from "../core/mysword-gbf-semantics";

export interface GbfRenderReport {
  mode: "semantic";
  events: number;
}

const FORMAT_ELEMENT: Readonly<Record<GbfTextFormat, {tag: "em" | "span"; className: string}>> = {
  "added-words": {tag: "em", className: "vd-gbf-added-words"},
  "old-testament-quote": {tag: "span", className: "vd-gbf-old-testament-quote"},
  "words-of-jesus": {tag: "span", className: "vd-gbf-words-of-jesus"},
  underline: {tag: "span", className: "vd-gbf-underline"}
};

const LINE_INDENT_CLASSES = [
  "vd-gbf-line-indent-0", "vd-gbf-line-indent-1", "vd-gbf-line-indent-2", "vd-gbf-line-indent-3",
  "vd-gbf-line-indent-4", "vd-gbf-line-indent-5", "vd-gbf-line-indent-6", "vd-gbf-line-indent-7"
] as const;
const FIRST_LINE_INDENT_CLASSES = [
  "vd-gbf-first-line-indent-0", "vd-gbf-first-line-indent-1", "vd-gbf-first-line-indent-2",
  "vd-gbf-first-line-indent-3", "vd-gbf-first-line-indent-4", "vd-gbf-first-line-indent-5",
  "vd-gbf-first-line-indent-6", "vd-gbf-first-line-indent-7"
] as const;
const TITLE_LEVEL_CLASSES = [
  "", "vd-gbf-title-1", "vd-gbf-title-2", "vd-gbf-title-3", "vd-gbf-title-4",
  "vd-gbf-title-5", "vd-gbf-title-6", "vd-gbf-title-7", "vd-gbf-title-8", "vd-gbf-title-9"
] as const;

type FrameKey = `format:${GbfTextFormat}` | "note" | "title";
interface RenderFrame {node: Node; key: FrameKey | "root"}

function formatFrame(event: GbfFormatEvent): FrameKey {
  return `format:${event.format}`;
}

function annotationFrame(event: GbfAnnotationEvent): "note" | "title" {
  return event.kind.startsWith("note-") ? "note" : "title";
}

/**
 * Renders only a complete, allowlisted semantic document. All module strings
 * enter the DOM through createTextNode; no module-provided tag/class is used.
 */
export function renderMySwordGbf(target: HTMLElement, semantics: GbfSemanticDocument): GbfRenderReport {
  if (!semantics.fullyInterpreted || !semantics.lossless || semantics.opaqueEvents !== 0) {
    throw new Error("MySword GBF document is not fully interpreted; use the literal-text fallback.");
  }
  const document = target.ownerDocument;
  const fragment = document.createDocumentFragment();
  const frames: RenderFrame[] = [{node: fragment, key: "root"}];
  let current: Node = fragment;

  const text = (value: string): void => { current.appendChild(document.createTextNode(value)); };
  const open = (element: HTMLElement, key: FrameKey): void => {
    current.appendChild(element);
    frames.push({node: element, key});
    current = element;
  };
  const close = (key: FrameKey): void => {
    const frame = frames.pop();
    if (!frame || frame.key !== key || frames.length === 0) {
      throw new Error("MySword GBF semantic event nesting is inconsistent.");
    }
    current = frames[frames.length - 1].node;
  };

  for (const event of semantics.events) {
    switch (event.kind) {
      case "text":
        text(event.text);
        break;
      case "format-open": {
        const allowed = FORMAT_ELEMENT[event.format];
        const element = document.createElement(allowed.tag);
        element.classList.add(allowed.className);
        open(element, formatFrame(event));
        break;
      }
      case "format-close":
        close(formatFrame(event));
        break;
      case "note-open": {
        const element = document.createElement("span");
        element.classList.add("vd-gbf-note");
        open(element, annotationFrame(event));
        break;
      }
      case "note-close":
        close(annotationFrame(event));
        break;
      case "title-open": {
        const element = document.createElement("span");
        element.classList.add("vd-gbf-title");
        if (event.level !== undefined) {
          const className = TITLE_LEVEL_CLASSES[event.level];
          if (!className) throw new Error("Unsupported GBF title level.");
          element.classList.add(className);
        }
        open(element, annotationFrame(event));
        break;
      }
      case "title-close":
        close(annotationFrame(event));
        break;
      case "paragraph-break":
        text("\n\n");
        break;
      case "separator":
        text(" ");
        break;
      case "poetry-indent": {
        const element = document.createElement("span");
        element.classList.add("vd-gbf-indent");
        const className = event.target === "line" ? LINE_INDENT_CLASSES[event.level] :
          FIRST_LINE_INDENT_CLASSES[event.level];
        if (!className) throw new Error("Unsupported GBF poetry indentation level.");
        element.classList.add(className);
        current.appendChild(element);
        break;
      }
      case "cross-reference":
        // Navigation/versification is not yet verified. Keep coordinates visible and inert.
        text(event.raw);
        break;
      case "opaque":
        throw new Error("Opaque GBF events cannot be rendered semantically.");
    }
  }
  if (frames.length !== 1 || frames[0].key !== "root") {
    throw new Error("MySword GBF semantic event nesting is incomplete.");
  }
  target.replaceChildren(fragment);
  return {mode: "semantic", events: semantics.events.length};
}
