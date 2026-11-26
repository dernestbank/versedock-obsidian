import type { SwordDockController } from "../controller";
import type { IndexedScriptureNote } from "../core/scripture-notes";
import { textButton } from "./components";

/** At most the explicitly displayed cards read an excerpt; the note index stays metadata-only. */
export function renderScriptureNoteCard(parent: HTMLElement, plugin: SwordDockController, note: IndexedScriptureNote, compact = false): void {
  const card = parent.createDiv({ cls: "vd-scripture-note-card" + (compact ? " is-compact" : "") });
  const title = textButton(card, note.basename, () => { void plugin.openLinkedNote(note.path); }, "vd-study-note-link");
  title.title = note.path;
  const excerpt = card.createEl("p", { cls: "vd-note-excerpt", text: "Loading note preview…" });
  const meta = card.createDiv({ cls: "vd-note-card-meta" });
  if (note.linkedToPrimary) meta.createSpan({ text: "Backlink" });
  if (!compact) card.createDiv({ cls: "vd-note-path", text: note.path });
  void plugin.getScriptureNotePreview(note.path).then(preview => {
    if (!card.isConnected) return;
    title.setText(preview.state === "missing" || preview.state === "unavailable" ? note.basename : preview.title);
    title.setAttribute("aria-label", title.textContent + "; open " + note.path);
    const messages = {
      empty: "No written observations yet.",
      "too-large": "Preview skipped for this large note. Open it to read.",
      missing: "This note is no longer available.",
      unavailable: "Preview unavailable. Open the note to read it."
    };
    excerpt.setText(preview.state === "ready" ? preview.text : messages[preview.state]);
    excerpt.toggleClass("is-empty", preview.state !== "ready");
    if (preview.modified) {
      const date = new Date(preview.modified);
      const time = meta.createEl("time", { text: "Modified " + date.toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
      }) });
      time.dateTime = date.toISOString();
    }
  }).catch(() => { if (card.isConnected) excerpt.setText("Preview unavailable. Open the note to read it."); });
}
