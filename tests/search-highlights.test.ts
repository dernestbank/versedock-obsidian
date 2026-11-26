import { describe, expect, it } from "vitest";
import { prepareBibleSearchQuery } from "../src/core/search";
import { findSearchHighlightRanges, renderSearchHighlights } from "../src/ui/search-highlights";

class FakeNode {
  readonly children: FakeNode[] = [];
  readonly classes: string[] = [];
  constructor(readonly nodeName: string, readonly value = "") {}
  appendChild(child: FakeNode): FakeNode {
    this.children.push(child);
    return child;
  }
  replaceChildren(...children: FakeNode[]): void {
    this.children.length = 0;
    this.children.push(...children);
  }
  get classList(): {add: (...names: string[]) => void} {
    return {add: (...names: string[]) => this.classes.push(...names)};
  }
  get textContent(): string {
    return this.nodeName === "#text" ? this.value : this.children.map(child => child.textContent).join("");
  }
  set innerHTML(_value: string) {
    throw new Error("innerHTML must never be used");
  }
}

class FakeDocument {
  readonly textInputs: string[] = [];
  readonly elements: FakeNode[] = [];
  createTextNode(value: string): FakeNode {
    this.textInputs.push(value);
    return new FakeNode("#text", value);
  }
  createElement(name: string): FakeNode {
    const element = new FakeNode(name);
    this.elements.push(element);
    return element;
  }
  createDocumentFragment(): FakeNode {
    return new FakeNode("#fragment");
  }
}

function fixture(): {document: FakeDocument; target: FakeNode & {ownerDocument: FakeDocument}} {
  const document = new FakeDocument();
  const target = new FakeNode("p") as FakeNode & {ownerDocument: FakeDocument};
  target.ownerDocument = document;
  return {document, target};
}

describe("search result highlighting", () => {
  it("finds every case-insensitive exact-phrase occurrence", () => {
    const text = "For God so loved; GOD SO LOVED.";
    const query = prepareBibleSearchQuery("God so loved", "phrase");
    const ranges = findSearchHighlightRanges(text, query);

    expect(ranges.map(range => text.slice(range.start, range.end))).toEqual(["God so loved", "GOD SO LOVED"]);
  });

  it("merges overlapping all-word ranges without changing source offsets", () => {
    const text = "loved GOD";
    const query = prepareBibleSearchQuery("love loved god", "all-words");

    expect(findSearchHighlightRanges(text, query)).toEqual([
      {start: 0, end: 5},
      {start: 6, end: 9}
    ]);
  });

  it("highlights every present Any words term and ignores absent terms", () => {
    const text = "Grace and peace";
    const query = prepareBibleSearchQuery("peace world grace", "any-words");

    expect(findSearchHighlightRanges(text, query).map(range => text.slice(range.start, range.end)))
      .toEqual(["Grace", "peace"]);
  });

  it("treats regular-expression characters in a search phrase as literal text", () => {
    const text = "not a wildcard; literal .* only";
    const query = prepareBibleSearchQuery(".*", "phrase");
    const ranges = findSearchHighlightRanges(text, query);

    expect(ranges.map(range => text.slice(range.start, range.end))).toEqual([".*"]);
  });

  it("renders hostile-looking verse text only through text nodes and fixed marks", () => {
    const text = "safe <img src=x onerror=alert(1)> God & world";
    const query = prepareBibleSearchQuery("God world", "all-words");
    const {document, target} = fixture();
    target.appendChild(document.createTextNode("old"));

    renderSearchHighlights(target as unknown as HTMLElement, text, query);

    expect(target.textContent).toBe(text);
    expect(document.elements.map(element => element.nodeName)).toEqual(["mark", "mark"]);
    expect(document.elements.flatMap(element => element.classes)).toEqual(["vd-search-highlight", "vd-search-highlight"]);
    expect(document.textInputs.join("")).toBe("old" + text);
  });
});
