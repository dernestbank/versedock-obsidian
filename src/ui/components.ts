import { setIcon } from "obsidian";

export function iconButton(parent: HTMLElement, icon: string, title: string, action: () => void, cls = ""): HTMLButtonElement {
  const button = parent.createEl("button", {
    cls: "vd-icon-button " + cls, attr: { type: "button", title, "aria-label": title }
  });
  setIcon(button, icon);
  button.addEventListener("click", action);
  return button;
}
export function textButton(parent: HTMLElement, title: string, action: () => void, cls = ""): HTMLButtonElement {
  const button = parent.createEl("button", {
    cls: "vd-text-button " + cls, text: title, attr: { type: "button" }
  });
  button.addEventListener("click", action);
  return button;
}
export function pill(parent: HTMLElement, value: string, cls = ""): HTMLElement {
  return parent.createSpan({ cls: "vd-pill " + cls, text: value });
}
export function emptyState(parent: HTMLElement, title: string, description: string, icon = "book-open"): HTMLElement {
  const wrapper = parent.createDiv({ cls: "vd-empty" });
  const glyph = wrapper.createDiv({ cls: "vd-empty-icon" });
  setIcon(glyph, icon);
  wrapper.createEl("h3", { text: title });
  wrapper.createEl("p", { text: description });
  return wrapper;
}
export function sectionHeading(parent: HTMLElement, title: string, eyebrow?: string): HTMLElement {
  const wrap = parent.createDiv({ cls: "vd-section-heading" });
  if (eyebrow) wrap.createSpan({ cls: "vd-overline", text: eyebrow });
  wrap.createEl("h2", { text: title });
  return wrap;
}
export function focusButton(el: HTMLElement): void {
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "button");
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); el.click();
    }
  });
}
