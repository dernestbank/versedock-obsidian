import type { PreparedBibleSearchQuery } from "../core/search";

export interface SearchHighlightRange {
  start: number;
  end: number;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findSearchHighlightRanges(text: string, query: PreparedBibleSearchQuery): readonly SearchHighlightRange[] {
  const ranges: SearchHighlightRange[] = [];
  for (const term of query.terms) {
    if (!term) continue;
    const expression = new RegExp(escapeRegularExpression(term), "giu");
    for (const match of text.matchAll(expression)) {
      const start = match.index;
      ranges.push({start, end: start + match[0].length});
    }
  }
  ranges.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: SearchHighlightRange[] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({...range});
  }
  return merged;
}

/** Replaces target content atomically; untrusted text enters the DOM only through text nodes. */
export function renderSearchHighlights(target: HTMLElement, text: string, query: PreparedBibleSearchQuery): void {
  const document = target.ownerDocument;
  const fragment = document.createDocumentFragment();
  let offset = 0;
  for (const range of findSearchHighlightRanges(text, query)) {
    if (range.start > offset) fragment.appendChild(document.createTextNode(text.slice(offset, range.start)));
    const mark = document.createElement("mark");
    mark.classList.add("vd-search-highlight");
    mark.appendChild(document.createTextNode(text.slice(range.start, range.end)));
    fragment.appendChild(mark);
    offset = range.end;
  }
  if (offset < text.length || text.length === 0) fragment.appendChild(document.createTextNode(text.slice(offset)));
  target.replaceChildren(fragment);
}
