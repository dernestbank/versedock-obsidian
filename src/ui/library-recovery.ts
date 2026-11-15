export const OFFLINE_LIBRARY_RECOVERY = {
  title: "Offline Bible unavailable",
  description: "The bundled WEB library is missing or unreadable. Reinstall the complete SwordDock Bible preview package, then choose Recheck offline library. Your vault notes and saved SwordDock settings are not removed.",
  action: "Recheck offline library",
  unavailableChip: "WEB · Unavailable",
  startupNotice: "SwordDock Bible: Offline WEB library missing or invalid. Reinstall the complete preview package."
} as const;

interface InitializableLibrary {
  initialize(): Promise<boolean>;
}

export interface LibraryRecheckResult {
  available: boolean;
  notice: string;
}

export async function recheckOfflineLibrary(library: InitializableLibrary): Promise<LibraryRecheckResult> {
  const available = await library.initialize();
  return {
    available,
    notice: available
      ? "Offline WEB library restored."
      : "Offline WEB library is still missing or invalid. Reinstall the complete preview package, then recheck."
  };
}
