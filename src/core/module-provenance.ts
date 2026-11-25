import type { LocalFileProvenance, ReadingKind, ReadingModule } from './reading-modules';

export function localModuleId(kind: ReadingKind, databaseSha256: string): string {
  return 'local-' + kind + '-' + databaseSha256.slice(0, 24);
}

export function isLocalModuleId(value: string, kind?: ReadingKind): boolean {
  return /^local-(?:bible|commentary|dictionary|book|devotional|graphics)-[a-f0-9]{24}$/.test(value)
    && (kind === undefined || value.startsWith('local-' + kind + '-'));
}

export function validateLocalProvenance(module: ReadingModule): void {
  const origin = module.provenance as LocalFileProvenance | undefined;
  if (!origin || origin.kind !== 'local-file' || module.sourcePage !== ''
    || typeof origin.fileName !== 'string' || !/^[^/\\\u0000-\u001f\u007f]{1,255}$/.test(origin.fileName)
    || typeof origin.compressed !== 'boolean' || typeof origin.citation !== 'string' || origin.citation.length > 2000
    || !/^[a-f0-9]{64}$/.test(origin.sourceSha256) || !/^[a-f0-9]{64}$/.test(origin.databaseSha256)
    || origin.sourceSha256 !== module.sourceSha256 || module.id !== localModuleId(module.kind, origin.databaseSha256))
    throw new Error('Invalid local-file provenance.');
}

export function moduleOrigin(module: ReadingModule): string {
  return module.provenance ? 'Local file · ' + module.provenance.fileName : module.sourcePage;
}

export function moduleSourceNotice(module: ReadingModule): string {
  if (!module.provenance) return module.notice;
  return [module.notice, moduleOrigin(module), module.provenance.citation].filter(Boolean).join('\n\n');
}
