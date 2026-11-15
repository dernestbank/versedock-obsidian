import { describe, expect, it } from "vitest";
import {
  OFFLINE_LIBRARY_RECOVERY,
  recheckOfflineLibrary
} from "../src/ui/library-recovery";

describe("offline library recovery", () => {
  it("gives package-level recovery guidance without developer-only instructions", () => {
    expect(OFFLINE_LIBRARY_RECOVERY.title).toBe("Offline Bible unavailable");
    expect(OFFLINE_LIBRARY_RECOVERY.description).toContain("complete SwordDock Bible preview package");
    expect(OFFLINE_LIBRARY_RECOVERY.description).toContain("Recheck offline library");
    expect(OFFLINE_LIBRARY_RECOVERY.description).not.toMatch(/builder|test vault|\.obsidian|\/Users\//i);
    expect(OFFLINE_LIBRARY_RECOVERY.startupNotice).toBe("SwordDock Bible: Offline WEB library missing or invalid. Reinstall the complete preview package.");
  });

  it("reports whether reinitialization restored the offline library", async () => {
    const restored = await recheckOfflineLibrary({ initialize: async () => true });
    const unavailable = await recheckOfflineLibrary({ initialize: async () => false });

    expect(restored).toEqual({
      available: true,
      notice: "Offline WEB library restored."
    });
    expect(unavailable).toEqual({
      available: false,
      notice: "Offline WEB library is still missing or invalid. Reinstall the complete preview package, then recheck."
    });
  });
});
