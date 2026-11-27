import { escapeMarkdownText, markdownInlineText } from './markdown-text';
/** Guard against inserting Scripture into a note that changed while the modal was open. */
export type EditorPosition = { line: number; ch: number };
export interface SafeInsertionEditor {
  getValue(): string;
  getCursor(which: "from" | "to"): EditorPosition;
  replaceRange(text: string, from: EditorPosition, to: EditorPosition): void;
}
export interface InsertionSnapshot {
  readonly content: string;
  readonly from: EditorPosition;
  readonly to: EditorPosition;
}
export type InsertFormat = "callout" | "quote" | "reference";
export type PassageLine = { verse: number; text: string };
const pos = (p: EditorPosition): EditorPosition => ({ line: p.line, ch: p.ch });
const equal = (a: EditorPosition, b: EditorPosition): boolean => a.line === b.line && a.ch === b.ch;
export function captureInsertionSnapshot(editor: SafeInsertionEditor): InsertionSnapshot {
  return { content: editor.getValue(), from: pos(editor.getCursor("from")), to: pos(editor.getCursor("to")) };
}
export function canInsertAtSnapshot(editor: SafeInsertionEditor, snapshot: InsertionSnapshot): boolean {
  return editor.getValue() === snapshot.content &&
    equal(editor.getCursor("from"), snapshot.from) && equal(editor.getCursor("to"), snapshot.to);
}
export function insertAtSnapshot(editor: SafeInsertionEditor, snapshot: InsertionSnapshot, markdown: string, layout: "inline" | "block" = "block"): boolean {
  if (!canInsertAtSnapshot(editor, snapshot)) return false;
  if (layout === "block") {
    const lines = snapshot.content.split("\n");
    const followedByNewline = snapshot.to.line < lines.length - 1 && snapshot.to.ch === lines[snapshot.to.line].length;
    const suffix = followedByNewline ? "\n" : "\n\n";
    markdown = (snapshot.from.ch > 0 ? "\n" : "") + markdown + suffix;
  }
  editor.replaceRange(markdown, snapshot.from, snapshot.to);
  return true;
}
export function formatPassageMarkdown(format: InsertFormat, referenceLabel: string, verses: readonly PassageLine[], targetPath?: string): string {
  const label = markdownInlineText(referenceLabel);
  if (format === "reference") return targetPath && !/[\r\n|[\]]/.test(targetPath)
    ? "[[" + targetPath + "|" + markdownInlineText(referenceLabel.replace(/[\r\n|[\]]/g, ' ')) + "]]"
    : label;
  const lines = verses.flatMap(v => v.text.replace(/\r\n?/g, "\n").split("\n").map((line, i) =>
    "> " + (i === 0 ? v.verse + " " : "") + escapeMarkdownText(line)));
  return format === "callout"
    ? ["> [!bible] " + label, ...lines].join("\n")
    : [...lines, "> — " + label].join("\n");
}
