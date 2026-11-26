import { gunzipSync } from 'fflate';
import type { DataAdapter } from 'obsidian';

declare const SWORDDOCK_LIBRARY: Record<string, [number, string]> | undefined;

// Community installations carry compressed, read-only resources in the release
// asset. Manual installations retain their existing, individually verifiable files.
export function bundledLibraryFolder(adapter: Pick<DataAdapter, 'read' | 'stat'>, pluginDir: string, library: string) {
  const packed = library === 'kjv' || typeof SWORDDOCK_LIBRARY === 'undefined' ? undefined : SWORDDOCK_LIBRARY;
  const folder = pluginDir + '/library/' + library + '/';
  return {
    async read(file: string): Promise<string> {
      if (!packed) return adapter.read(folder + file);
      const entry = packed[library + '/' + file];
      if (!entry) throw Error('Missing bundled library file.');
      const binary = atob(entry[1]);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      if (typeof DecompressionStream === 'function') {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        return new Response(stream).text();
      }
      return new TextDecoder().decode(gunzipSync(bytes));
    },
    async size(file: string): Promise<number | null> {
      if (packed) return packed[library + '/' + file]?.[0] ?? null;
      const stat = await adapter.stat(folder + file);
      return stat?.type === 'file' ? stat.size : null;
    }
  };
}
