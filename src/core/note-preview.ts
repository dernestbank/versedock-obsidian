export const MAX_NOTE_PREVIEW_BYTES = 256 * 1024;
const MAX_PREVIEW_SCAN = 16 * 1024;
export interface ScriptureNotePreview {
  state: "ready" | "empty" | "too-large" | "missing" | "unavailable";
  title: string; text: string; modified: number | null;
}

/** A short, lossy plain-text excerpt; no Markdown renderer, embeds or network requests. */
export function notePreviewText(markdown: string): string {
  const source = markdown.slice(0, MAX_PREVIEW_SCAN).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "");
  const lines = source.split("\n");
  let start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((line, index) => index > 0 && ["---", "..."].includes(line.trim()));
    if (end < 0) return "";
    start = end + 1;
  }
  let fence: { character: string; length: number } | null = null;
  const paragraph: string[] = [];
  for (let index = start; index < lines.length; index++) {
    const line = lines[index];
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (marker) {
      if (!fence) fence = { character: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.character && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    if (!line.trim()) { if (paragraph.length) break; continue; }
    if (/^ {0,3}#{1,6}\s/.test(line) || /^\s*>/.test(line) || /^\s*</.test(line)
      || /^\s*([-*_]\s*){3,}$/.test(line) || /^\s*[=-]{2,}\s*$/.test(lines[index + 1] ?? "")) {
      if (paragraph.length) break;
      continue;
    }
    const text = line
      .replace(/!?\[\[([^\]\n]{1,1000})\]\]/g, (match, target: string) => match.startsWith("!") ? "" : target.split("|").at(-1)!)
      .replace(/!?\[([^\]\n]{0,1000})\]\([^\)\n]{0,2000}\)/g, (match, label: string) => match.startsWith("!") ? "" : label)
      .replace(/<\/?[A-Za-z][^>\n]{0,1000}>/g, "")
      .replace(/^\s*(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/, "")
      .replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim();
    if (text) paragraph.push(text);
  }
  const text = paragraph.join(" ");
  const characters = Array.from(text);
  if (characters.length <= 180) return text;
  const excerpt = characters.slice(0, 180).join("");
  const boundary = excerpt.lastIndexOf(" ");
  return (boundary > 125 ? excerpt.slice(0, boundary) : excerpt).trimEnd() + "…";
}
