import { marksForVerse, type MarkPart, type ReaderAnnotation } from "../core/annotations";

function scriptureNodes(element: HTMLElement): Text[] {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.parentElement?.closest(".vd-inline-strongs")) nodes.push(node as Text);
  }
  return nodes;
}

/** DOM ranges are in document order even when the reader drags backwards. */
export function selectedMarkParts(passage: HTMLElement, range: Range | null, selected: string[], selector = ".vd-verse-text[data-reference]"): MarkPart[] {
  if (range && (!passage.contains(range.startContainer) || !passage.contains(range.endContainer))) return [];
  const parts: MarkPart[] = [];
  for (const el of (passage.matches(selector) ? [passage] : passage.querySelectorAll<HTMLElement>(selector))) {
    const ref = el.dataset.reference!;
    if (range ? !range.intersectsNode(el) : !selected.includes(ref)) continue;
    let offset = 0, start = 0, quote = "";
    for (const node of scriptureNodes(el)) {
      if (!range || range.intersectsNode(node)) {
        const from = range?.startContainer === node ? range.startOffset : 0;
        const to = range?.endContainer === node ? range.endOffset : node.length;
        if (from < to) {
          if (!quote) start = offset + from;
          quote += node.data.slice(from, to);
        }
      }
      offset += node.length;
    }
    if (quote.trim()) parts.push({ref, start, quote});
  }
  return parts;
}

export function paintAnnotations(el: HTMLElement, marks: ReaderAnnotation[], edition: string): void {
  if (!marks.length) return;
  const nodes = scriptureNodes(el);
  const ranges = marksForVerse(marks, edition, el.dataset.reference!, nodes.map(node => node.data).join(""));
  if (!ranges.length) return;
  let offset = 0;
  for (const node of nodes) {
    const end = offset + node.length;
    const intersections = ranges.filter(range => range.start < end && range.end > offset);
    if (intersections.length) {
      const cuts = new Set([offset, end]);
      for (const range of intersections) {
        cuts.add(Math.max(offset, range.start));
        cuts.add(Math.min(end, range.end));
      }
      const fragment = el.ownerDocument.createDocumentFragment();
      let previous = offset;
      for (const next of [...cuts].sort((a,b) => a-b)) {
        if (next === previous) continue;
        let part: Node = el.ownerDocument.createTextNode(node.data.slice(previous-offset, next-offset));
        for (const { start, end: stop, mark } of intersections) {
          if (start > previous || stop < next) continue;
          const tag = el.ownerDocument.createElement("mark");
          tag.className = "vd-annotation vd-mark-" + mark.color + " vd-mark-" + mark.style;
          tag.dataset.annotationId = mark.id;
          tag.title = mark.note || mark.resource?.label || "Scripture annotation";
          tag.append(part);
          part = tag;
        }
        fragment.append(part);
        previous = next;
      }
      node.replaceWith(fragment);
    }
    offset = end;
  }
}
