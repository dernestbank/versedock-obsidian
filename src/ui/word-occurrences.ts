import type { SwordDockController } from "../controller";
import { textButton } from "./components";

/** Source-tagged verse results with an exact total and bounded, reversible pages. */
export function renderWordOccurrences(parent: HTMLElement, plugin: SwordDockController, key: string): () => void {
  const status = parent.createEl("p", { cls: "vd-subtle", attr: { role: "status", "aria-live": "polite" } });
  const controls = parent.createDiv({ cls: "vd-action-row vd-occurrence-pages" });
  const previous = textButton(controls, "Previous results", () => { if (!loading) void load(Math.max(0, offset - size)); });
  const next = textButton(controls, "Next results", () => { if (!loading) void load(offset + size); });
  const results = parent.createDiv({ cls: "vd-word-occurrences" });
  parent.createEl("p", { cls: "vd-word-credit vd-subtle", text: "Counts matching displayed tagged verses in this KJV edition. Repeated tags within a verse count once; verse numbering remains source-specific." });
  let offset = 0, version = 0, loading = false;
  const size = 25;
  let active: AbortController | null = null;
  const load = async (start: number): Promise<void> => {
    const current = ++version;
    const focused = document.activeElement;
    active?.abort(); active = new AbortController();
    loading = true;
    previous.setAttribute("aria-disabled", "true"); next.setAttribute("aria-disabled", "true");
    status.setText("Searching " + key + " in tagged KJV…");
    results.setAttribute("aria-busy", "true");
    try {
      const page = await plugin.kjv.findStrongs(key, size, active.signal, start);
      if (current !== version || !results.isConnected) return;
      offset = page.offset;
      status.setText(key + " · " + page.total + " KJV tagged verses" + (page.results.length ? " · " + (offset + 1) + "–" + (offset + page.results.length) : ""));
      results.empty();
      for (const result of page.results) {
        const row = results.createDiv({ cls: "vd-word-occurrence" });
        textButton(row, result.label, () => {
          void plugin.setBibleEdition("kjv").then(() => {
            plugin.selectReference({ book: result.book, chapter: result.chapter, verse: result.verse });
            void plugin.openReader();
          });
        });
        row.createEl("p", { text: result.text });
      }
      if (!page.total) results.createEl("p", { text: "No displayed KJV words carry this source tag." });
      previous.disabled = offset === 0;
      next.disabled = !page.truncated;
      if (document.activeElement === document.body) {
        // Disabling a control on its final page can remove native keyboard focus.
        // Keep that transition within the paging controls only when they initiated it.
        if (focused === previous && previous.disabled) next.focus({ preventScroll: true });
        if (focused === next && next.disabled) previous.focus({ preventScroll: true });
      }
    } catch (error) {
      if (current !== version || !results.isConnected || (error instanceof Error && error.name === "AbortError")) return;
      status.setText(error instanceof Error ? error.message : "Word search unavailable.");
      results.empty();
    } finally {
      if (current === version) {
        loading = false;
        previous.setAttribute("aria-disabled", String(previous.disabled));
        next.setAttribute("aria-disabled", String(next.disabled));
        results.setAttribute("aria-busy", "false");
      }
    }
  };
  void load(0);
  return () => { version++; active?.abort(); };
}
