export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export interface StorageResourceRow {
  title: string;
  status: string;
  details: string;
  canRemove: boolean;
  note: string;
}

/** Describes the bundled resource without implying that cleanup is available. */
export function storageResourceRow(installed: boolean, summary: {
  bytes: number;
  files: number;
  missing: number;
}, current = true): StorageResourceRow {
  if (!installed) {
    return {
      title: "World English Bible",
      status: "Unavailable",
      details: "No installed files measured",
      canRemove: false,
      note: "Recheck the offline library before reviewing storage cleanup."
    };
  }
  const missing = summary.missing ? " · " + summary.missing + " missing" : "";
  return {
    title: "World English Bible",
    status: current ? "Current default · protected" : "Bundled · Offline",
    details: formatStorageBytes(summary.bytes) + " · " + summary.files + " files" + missing,
    canRemove: false,
    note: "Bundled resource removal is unavailable in this preview."
  };
}
