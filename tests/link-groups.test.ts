import { describe, expect, it, vi } from "vitest";
import { normalizeStudyLinkAssignment, StudyLinkBus, type StudyLinkEvent } from "../src/core/link-groups";

const event = (overrides: Partial<StudyLinkEvent> = {}): StudyLinkEvent => ({
  eventId: "evt-1",
  timestamp: 100,
  origin: "reader",
  group: "A",
  osis: "John.3.16",
  sourceVersification: "osis",
  selectionKind: "verse",
  cause: "user",
  ...overrides,
});

describe("StudyLinkBus", () => {
  it("normalizes persisted assignments and keeps unlinked mode follow-only", () => {
    expect(normalizeStudyLinkAssignment({ group: "B", mode: "pinned" })).toEqual({ group: "B", mode: "pinned" });
    expect(normalizeStudyLinkAssignment({ group: "unlinked", mode: "pinned" })).toEqual({ group: "unlinked", mode: "follow" });
    expect(normalizeStudyLinkAssignment({ group: "invalid", mode: "invalid" })).toEqual({ group: "unlinked", mode: "follow" });
  });

  it("delivers a link event to subscribers once", () => {
    const bus = new StudyLinkBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    bus.publish(event());

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(event());
  });

  it("deduplicates an event id while allowing a later event", () => {
    const bus = new StudyLinkBus();
    const listener = vi.fn();
    bus.subscribe(listener);

    bus.publish(event());
    bus.publish(event());
    bus.publish(event({ eventId: "evt-2", osis: "John.3.17" }));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].osis).toBe("John.3.17");
  });

  it("does not replay events to a subscriber after unsubscribe", () => {
    const bus = new StudyLinkBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);
    unsubscribe();

    bus.publish(event());

    expect(listener).not.toHaveBeenCalled();
  });
});
