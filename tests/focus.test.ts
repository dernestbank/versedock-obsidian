import { describe, expect, it, vi } from "vitest";
import { requestsFocusRestoration, restoreActionFocus } from "../src/ui/focus";

function fixture(active: "body" | "control" | "target" | "none", connected = true) {
  const body = {};
  const documentElement = {};
  const control = {};
  const focus = vi.fn();
  let scheduled: FrameRequestCallback | undefined;
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    scheduled = callback;
    return 1;
  });
  const ownerDocument: {
    activeElement: Element | null;
    body: HTMLElement;
    documentElement: HTMLElement;
    defaultView: Pick<Window, "requestAnimationFrame">;
  } = {
    activeElement: null,
    body: body as HTMLElement,
    documentElement: documentElement as HTMLElement,
    defaultView: {requestAnimationFrame}
  };
  const target = {isConnected: connected, ownerDocument, focus} as unknown as HTMLElement;
  ownerDocument.activeElement = active === "body" ? ownerDocument.body :
    active === "control" ? control as Element : active === "target" ? target : null;
  return {
    target,
    focus,
    requestAnimationFrame,
    runScheduled: () => scheduled?.(0),
    moveFocusToControl: () => { ownerDocument.activeElement = control as Element; }
  };
}

describe("async action focus restoration", () => {
  it("requests restoration for keyboard or assistive activation, but not pointer clicks", () => {
    expect(requestsFocusRestoration({detail: 0})).toBe(true);
    expect(requestsFocusRestoration({detail: 1})).toBe(false);
  });

  it("returns keyboard focus after disabling the active action moves focus to the document", () => {
    const {target, focus, requestAnimationFrame, runScheduled} = fixture("body");

    restoreActionFocus(target, true);

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(focus).not.toHaveBeenCalled();
    runScheduled();
    expect(focus).toHaveBeenCalledWith({preventScroll: true});
  });

  it("does not steal focus when the user moved to another control", () => {
    const {target, focus, runScheduled} = fixture("control");

    restoreActionFocus(target, true);
    runScheduled();

    expect(focus).not.toHaveBeenCalled();
  });

  it("does not steal focus moved to another control while restoration is pending", () => {
    const {target, focus, runScheduled, moveFocusToControl} = fixture("body");

    restoreActionFocus(target, true);
    moveFocusToControl();
    runScheduled();

    expect(focus).not.toHaveBeenCalled();
  });

  it("does nothing for mouse activation, disconnected targets, or retained focus", () => {
    const mouse = fixture("body");
    const disconnected = fixture("body", false);
    const retained = fixture("target");

    restoreActionFocus(mouse.target, false);
    restoreActionFocus(disconnected.target, true);
    restoreActionFocus(retained.target, true);

    mouse.runScheduled();
    disconnected.runScheduled();
    retained.runScheduled();

    expect(mouse.focus).not.toHaveBeenCalled();
    expect(disconnected.focus).not.toHaveBeenCalled();
    expect(retained.focus).not.toHaveBeenCalled();
  });
});
