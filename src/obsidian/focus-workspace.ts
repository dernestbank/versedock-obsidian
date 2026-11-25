export interface FocusDockState { leftCollapsed: boolean; rightCollapsed: boolean }
interface NativeDock { collapsed: boolean; collapse(): void; expand(): void }
interface NativeDocks { leftSplit: NativeDock; rightSplit: NativeDock }
export function restoredFocusDockState(value: unknown): FocusDockState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const state = value as Partial<FocusDockState>;
  return typeof state.leftCollapsed === "boolean" && typeof state.rightCollapsed === "boolean"
    ? { leftCollapsed: state.leftCollapsed, rightCollapsed: state.rightCollapsed } : null;
}

/** Owns only native collapse flags. It never moves, closes or replaces workspace leaves. */
export class FocusDockSession {
  private snapshot: FocusDockState | null;
  private enabled = true;
  constructor(private readonly workspace: NativeDocks, initial: unknown,
    private readonly changed: (state: FocusDockState | null) => void) {
    this.snapshot = restoredFocusDockState(initial);
  }
  update(focusReader: boolean): void {
    if (!this.enabled) return;
    if (focusReader) {
      if (!this.snapshot) {
        this.snapshot = { leftCollapsed: this.workspace.leftSplit.collapsed, rightCollapsed: this.workspace.rightSplit.collapsed };
        this.changed({ ...this.snapshot });
      }
      if (!this.workspace.leftSplit.collapsed) this.workspace.leftSplit.collapse();
      if (!this.workspace.rightSplit.collapsed) this.workspace.rightSplit.collapse();
    } else if (this.snapshot) {
      this.restore(); this.snapshot = null; this.changed(null);
    }
  }
  stop(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.restore();
    // Keep the saved snapshot available for startup recovery after plugin/app reload.
  }
  private restore(): void {
    if (!this.snapshot) return;
    for (const [dock, collapsed] of [[this.workspace.leftSplit, this.snapshot.leftCollapsed],
      [this.workspace.rightSplit, this.snapshot.rightCollapsed]] as const) {
      if (dock.collapsed !== collapsed) { if (collapsed) dock.collapse(); else dock.expand(); }
    }
  }
}
