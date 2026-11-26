import type { Workspace } from "obsidian";

/** Recover full-page tools from the side splits used by older builds. */
export async function migrateStudyToolsToCenter(workspace: Workspace, types: readonly string[]): Promise<void> {
  for (const type of types) {
    for (const oldLeaf of workspace.getLeavesOfType(type)) {
      const root = oldLeaf.getRoot();
      if (root !== workspace.leftSplit && root !== workspace.rightSplit) continue;
      const replacement = workspace.getLeaf(true);
      try {
        await replacement.setViewState({ ...oldLeaf.getViewState(), active: false });
      } catch (error) {
        replacement.detach();
        throw error;
      }
      oldLeaf.detach();
    }
  }
}
