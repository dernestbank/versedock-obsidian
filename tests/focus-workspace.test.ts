import { describe, expect, it, vi } from "vitest";
import { FocusDockSession, restoredFocusDockState } from "../src/obsidian/focus-workspace";

function dock(collapsed: boolean) {
  return { collapsed, collapse: vi.fn(function (this: { collapsed: boolean }) { this.collapsed = true; }),
    expand: vi.fn(function (this: { collapsed: boolean }) { this.collapsed = false; }) };
}
describe("reversible Focus docks", () => {
  it("captures and restores each native dock independently without touching leaves", () => {
    const workspace = { leftSplit: dock(true), rightSplit: dock(false) };
    const save = vi.fn();
    const session = new FocusDockSession(workspace, null, save);
    session.update(true);
    expect(workspace.leftSplit.collapsed).toBe(true);
    expect(workspace.rightSplit.collapsed).toBe(true);
    expect(save).toHaveBeenLastCalledWith({ leftCollapsed: true, rightCollapsed: false });
    session.update(true);
    expect(save).toHaveBeenCalledTimes(1);
    session.update(false);
    expect(workspace.leftSplit.collapsed).toBe(true);
    expect(workspace.rightSplit.collapsed).toBe(false);
    expect(save).toHaveBeenLastCalledWith(null);
  });
  it("restores a persisted Focus snapshot after app reload", () => {
    const workspace = { leftSplit: dock(true), rightSplit: dock(true) };
    const session = new FocusDockSession(workspace, { leftCollapsed: false, rightCollapsed: false }, vi.fn());
    session.update(true);
    session.update(false);
    expect(workspace.leftSplit.collapsed).toBe(false);
    expect(workspace.rightSplit.collapsed).toBe(false);
  });
  it("returns the docks when switching away and captures later user changes on return", () => {
    const workspace = { leftSplit: dock(false), rightSplit: dock(false) };
    const session = new FocusDockSession(workspace, null, vi.fn());
    session.update(true); session.update(false);
    workspace.leftSplit.collapse();
    session.update(true); session.update(false);
    expect(workspace.leftSplit.collapsed).toBe(true);
    expect(workspace.rightSplit.collapsed).toBe(false);
  });
  it("restores on unload and refuses subsequent callbacks without clearing the persisted recovery snapshot", () => {
    const workspace = { leftSplit: dock(false), rightSplit: dock(true) };
    const save = vi.fn();
    const session = new FocusDockSession(workspace, null, save);
    session.update(true); session.stop(); session.update(true);
    expect(workspace.leftSplit.collapsed).toBe(false);
    expect(workspace.rightSplit.collapsed).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });
  it("does not change native docks when Focus has not captured them", () => {
    const workspace = { leftSplit: dock(false), rightSplit: dock(true) };
    const save = vi.fn();
    const session = new FocusDockSession(workspace, null, save);
    session.update(false); session.stop();
    expect(workspace.leftSplit.collapse).not.toHaveBeenCalled();
    expect(workspace.rightSplit.expand).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it("refuses malformed persisted snapshots", () => {
    for (const value of [null, [], "closed", { leftCollapsed: true }, { leftCollapsed: "false", rightCollapsed: false }])
      expect(restoredFocusDockState(value)).toBeNull();
  });
});
