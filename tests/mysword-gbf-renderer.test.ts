import { describe, expect, it } from "vitest";
import { interpretMySwordGbf } from "../src/core/mysword-gbf-semantics";
import { renderMySwordGbf } from "../src/ui/mysword-gbf-renderer";

class FakeNode {
  readonly children: FakeNode[] = [];
  readonly classes: string[] = [];
  parent: FakeNode | null = null;
  constructor(readonly nodeName: string, readonly value = "") {}
  appendChild(child: FakeNode): FakeNode {
    child.parent = this;
    this.children.push(child);
    return child;
  }
  replaceChildren(...children: FakeNode[]): void {
    this.children.length = 0;
    for (const child of children) this.appendChild(child);
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
  const target = new FakeNode("div") as FakeNode & {ownerDocument: FakeDocument};
  target.ownerDocument = document;
  return {document, target};
}

describe("safe MySword GBF DOM renderer", () => {
  it("renders supported semantics with text nodes and hardcoded elements", () => {
    const source = "<TS2>Heading<Ts><CM><PI2><RF q=a>Note <FI>added<Fi><Rf>";
    const semantics = interpretMySwordGbf(source);
    const {document, target} = fixture();

    const report = renderMySwordGbf(target as unknown as HTMLElement, semantics);

    expect(report).toEqual({mode: "semantic", events: semantics.events.length});
    expect(target.textContent).toBe("Heading\n\nNote added");
    expect(document.textInputs).toEqual(["Heading", "\n\n", "Note ", "added"]);
    expect(document.elements.map(element => element.nodeName)).toEqual(["span", "span", "span", "em"]);
    expect(document.elements.flatMap(element => element.classes)).toEqual([
      "vd-gbf-title", "vd-gbf-title-2", "vd-gbf-indent", "vd-gbf-line-indent-2",
      "vd-gbf-note", "vd-gbf-added-words"
    ]);
  });

  it("rejects hostile HTML before changing the target", () => {
    const semantics = interpretMySwordGbf("safe <img src=x onerror=alert(1)> text");
    const {document, target} = fixture();
    target.appendChild(document.createTextNode("existing"));

    expect(() => renderMySwordGbf(target as unknown as HTMLElement, semantics))
      .toThrow(/not fully interpreted/i);
    expect(target.textContent).toBe("existing");
    expect(document.elements).toEqual([]);
  });

  it("keeps RX coordinates inert and never creates a link", () => {
    const semantics = interpretMySwordGbf("See <RX43.3.16>.");
    const {document, target} = fixture();

    renderMySwordGbf(target as unknown as HTMLElement, semantics);

    expect(target.textContent).toBe("See <RX43.3.16>.");
    expect(document.elements.map(element => element.nodeName)).not.toContain("a");
  });

  it("leaves the target unchanged when a late nesting check fails", () => {
    const semantics = interpretMySwordGbf("Before <FI>after<Fi>");
    semantics.events.pop();
    const {document, target} = fixture();
    target.appendChild(document.createTextNode("existing"));

    expect(() => renderMySwordGbf(target as unknown as HTMLElement, semantics))
      .toThrow(/nesting is incomplete/i);
    expect(target.textContent).toBe("existing");
  });
});
