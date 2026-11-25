import { describe, expect, it, vi } from "vitest";
import type { Workspace } from "obsidian";
import { migrateStudyToolsToCenter } from "../src/obsidian/study-layout";

function fixture(fail = false) {
  const rightSplit = {};
  const oldLeaf = { getRoot: () => rightSplit, getViewState: () => ({ type: "tool", state: { query: "love" } }), detach: vi.fn() };
  const replacement = { setViewState: vi.fn(async () => { if (fail) throw new Error("failed"); }), detach: vi.fn() };
  const workspace = { rightSplit, leftSplit: {}, getLeavesOfType: vi.fn(() => [oldLeaf]), getLeaf: vi.fn(() => replacement) };
  return { oldLeaf, replacement, workspace };
}
describe("Study Desk upgrade layout", () => {
  it("preserves view state while reopening only side-dock tools in the center", async () => {
    const { workspace, oldLeaf, replacement } = fixture();
    await migrateStudyToolsToCenter(workspace as unknown as Workspace, ["tool"]);
    expect(replacement.setViewState).toHaveBeenCalledWith({ type: "tool", state: { query: "love" }, active: false });
    expect(oldLeaf.detach).toHaveBeenCalledOnce();
  });
  it("does not touch existing central leaves", async () => {
    const { workspace, oldLeaf } = fixture();
    oldLeaf.getRoot = () => ({});
    await migrateStudyToolsToCenter(workspace as unknown as Workspace, ["tool"]);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
    expect(oldLeaf.detach).not.toHaveBeenCalled();
  });
  it("retains the original leaf if its replacement cannot open", async () => {
    const { workspace, oldLeaf, replacement } = fixture(true);
    await expect(migrateStudyToolsToCenter(workspace as unknown as Workspace, ["tool"])).rejects.toThrow("failed");
    expect(oldLeaf.detach).not.toHaveBeenCalled();
    expect(replacement.detach).toHaveBeenCalledOnce();
  });
});
