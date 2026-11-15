import { describe, it, expect } from "vitest";
import { captureInsertionSnapshot, canInsertAtSnapshot, insertAtSnapshot, formatPassageMarkdown,
  type EditorPosition, type SafeInsertionEditor } from "../src/core/insertion";

function stub(value = "Study note", from: EditorPosition = { line: 0, ch: 5 }, to = from) {
  let text = value, a = { ...from }, b = { ...to }, calls = 0;
  const editor: SafeInsertionEditor = {
    getValue: () => text,
    getCursor: which => which === "from" ? { ...a } : { ...b },
    replaceRange: (s, f, t) => {
      calls++;
      expect(f).toEqual(a); expect(t).toEqual(b);
      text = text.slice(0, f.ch) + s + text.slice(t.ch);
    }
  };
  return { editor, setText: (v: string) => { text = v; },
    setSelection: (f: EditorPosition, t = f) => { a = f; b = t; },
    text: () => text, calls: () => calls };
}
describe("safe Scripture insertion", () => {
  it("inserts at the captured selection in one editor transaction", () => {
    const s = stub(), p = captureInsertionSnapshot(s.editor);
    expect(insertAtSnapshot(s.editor, p, "> Scripture")).toBe(true);
    expect(s.text()).toBe("Study> Scripture\n note");
    expect(s.calls()).toBe(1);
  });
  it("rejects edited notes", () => {
    const s = stub(), p = captureInsertionSnapshot(s.editor); s.setText("Changed note");
    expect(insertAtSnapshot(s.editor, p, "> Scripture")).toBe(false);
    expect(s.calls()).toBe(0);
  });
  it("rejects moved cursors and changed selections", () => {
    const s = stub(), p = captureInsertionSnapshot(s.editor);
    s.setSelection({ line: 0, ch: 0 });
    expect(canInsertAtSnapshot(s.editor, p)).toBe(false);
    expect(insertAtSnapshot(s.editor, p, "> Scripture")).toBe(false);
    const q = stub("Study note", { line: 0, ch: 0 }, { line: 0, ch: 5 });
    const x = captureInsertionSnapshot(q.editor);
    q.setSelection({ line: 0, ch: 6 }, { line: 0, ch: 10 });
    expect(insertAtSnapshot(q.editor, x, "> Scripture")).toBe(false);
  });
  it("formats multiline verses in attributed callouts and quotes", () => {
    const v = [{ verse: 16, text: "First line\nsecond line" }];
    expect(formatPassageMarkdown("callout", "John 3:16 (WEB)", v)).toBe(
      "> [!bible] John 3:16 (WEB)\n> 16 First line\n> second line");
    expect(formatPassageMarkdown("quote", "John 3:16 (WEB)", v)).toBe(
      "> 16 First line\n> second line\n> — John 3:16 (WEB)");
  });
});
