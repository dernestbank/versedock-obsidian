export type StudyLinkGroup = "unlinked" | "A" | "B" | "C";
export type StudyLinkMode = "follow" | "pinned";
export type StudyLinkOrigin = "reader" | "comparison" | "inspector" | "search";
export type StudyLinkSelectionKind = "chapter" | "verse" | "range";
export type StudyLinkCause = "user" | "navigation" | "history" | "programmatic";

export interface StudyLinkAssignment {
  group: StudyLinkGroup;
  mode: StudyLinkMode;
}

export function normalizeStudyLinkAssignment(value: unknown): StudyLinkAssignment {
  if (!value || typeof value !== "object") return { group: "unlinked", mode: "follow" };
  const candidate = value as { group?: unknown; mode?: unknown };
  const group: StudyLinkGroup = candidate.group === "A" || candidate.group === "B" || candidate.group === "C"
    ? candidate.group : "unlinked";
  const mode: StudyLinkMode = candidate.mode === "pinned" ? "pinned" : "follow";
  return { group, mode: group === "unlinked" ? "follow" : mode };
}

export interface StudyLinkEvent {
  eventId: string;
  timestamp: number;
  origin: StudyLinkOrigin;
  group: Exclude<StudyLinkGroup, "unlinked">;
  osis: string;
  sourceVersification: string;
  selectionKind: StudyLinkSelectionKind;
  cause: StudyLinkCause;
}

type StudyLinkListener = (event: StudyLinkEvent) => void;

/** Small plugin-owned bus. Views decide whether a matching group should be followed. */
export class StudyLinkBus {
  private readonly listeners = new Set<StudyLinkListener>();
  private readonly seenEventIds = new Set<string>();

  subscribe(listener: StudyLinkListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: StudyLinkEvent): void {
    if (this.seenEventIds.has(event.eventId)) return;
    this.seenEventIds.add(event.eventId);
    if (this.seenEventIds.size > 512) {
      const oldest = this.seenEventIds.values().next().value as string | undefined;
      if (oldest) this.seenEventIds.delete(oldest);
    }
    for (const listener of [...this.listeners]) listener(event);
  }
}
