export function requestsFocusRestoration(event: Pick<MouseEvent, "detail">): boolean {
  return event.detail === 0;
}

/**
 * Returns focus on the next frame after an async keyboard action only when
 * focus settled on the document itself. Never steals focus from another control.
 */
export function restoreActionFocus(target: HTMLElement, requested: boolean): void {
  if (!requested || !target.isConnected) return;
  const document = target.ownerDocument;
  document.defaultView?.requestAnimationFrame(() => {
    if (!target.isConnected) return;
    const active = document.activeElement;
    if (active === target) return;
    if (active === null || active === document.body || active === document.documentElement) {
      target.focus({preventScroll: true});
    }
  });
}
