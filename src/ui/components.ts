import { setIcon } from "obsidian";
import type { StudyLinkAssignment } from "../controller";

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
export function linkButton(parent: HTMLElement, assignment: StudyLinkAssignment, action: () => void): HTMLButtonElement {
  const label = assignment.group === "unlinked"
    ? "Links · Unlinked"
    : "Link " + assignment.group + " · " + (assignment.mode === "follow" ? "Follow" : "Pinned");
  const button = textButton(parent, label, action, "vd-link-selector");
  button.dataset.linkGroup = assignment.group;
  button.dataset.linkMode = assignment.mode;
  button.setAttribute("aria-label", label);
  if (assignment.group !== "unlinked") {
    button.empty();
    button.createSpan({ cls: "vd-link-dot", attr: { "aria-hidden": "true" } });
    button.createSpan({ text: "Link " + assignment.group });
    button.createSpan({ cls: "vd-link-mode", text: "· " + (assignment.mode === "follow" ? "Follow" : "Pinned") });
  }
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
