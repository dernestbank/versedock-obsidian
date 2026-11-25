import type { SqlJsStatic } from 'sql.js';
import { gunzipBounded, sha256, validateReadingContent } from './module-installation';
import { localModuleId } from './module-provenance';
import { normalizeModuleContent } from './normalize-module';
import { checkCancelled, MAX_READING_BYTES, modulePlainText, type ReadingKind, type ReadingModule } from './reading-modules';

export interface LocalFileInput { name: string; bytes: Uint8Array }
export interface PreparedLocalModule { module: ReadingModule; selectedBytes: number; databaseBytes: number; preparedBytes: number }
export interface LocalImportPreview {
  ticket: string; id: string; kind: ReadingKind; title: string; author: string; version: string; abbreviation: string; language: string;
  fileName: string; sourceSha256: string; databaseSha256: string; compressed: boolean;
  selectedBytes: number; databaseBytes: number; preparedBytes: number; entryCount: number; imageCount: number;
  notice: string; samples: Array<{title: string; text: string}>;
}

function physicalType(sql: SqlJsStatic, bytes: Uint8Array): 'bible' | 'commentary' | 'dictionary' | 'journal' {
  if (bytes.length < 100 || new TextDecoder().decode(bytes.slice(0, 16)) !== 'SQLite format 3\0')
    throw new Error('Choose an unencrypted SQLite module or a gzip-compressed SQLite module. ZIP archives and encrypted files are unsupported.');
  const db = new sql.Database(bytes);
  try {
    db.run('PRAGMA trusted_schema=OFF'); db.run('PRAGMA query_only=ON');
    const tables = new Set(db.exec("SELECT lower(name) FROM sqlite_master WHERE type='table' AND upper(sql) NOT LIKE 'CREATE VIRTUAL%'")[0]?.values.map(row => String(row[0])) ?? []);
    const types = (['bible', 'commentary', 'dictionary', 'journal'] as const).filter(type => tables.has(type));
    if (!tables.has('details') || types.length !== 1)
      throw new Error('Expected one supported physical module schema with a Details table. Ambiguous schemas and views are unsupported.');
    return types[0];
  } catch (error) {
    if (error instanceof Error && /schema|physical/.test(error.message)) throw error;
    throw new Error('The SQLite module is damaged, encrypted or has an unsupported schema.');
  } finally { db.close(); }
}

/** Owns its source bytes; preparation never writes or modifies the selected file. */
export async function prepareLocalModule(sql: SqlJsStatic, input: LocalFileInput,
  chosenKind?: ReadingKind, signal?: AbortSignal): Promise<PreparedLocalModule> {
  checkCancelled(signal);
  if (!input.bytes.length || input.bytes.length > MAX_READING_BYTES)
    throw new Error('Selected files must be nonempty and at most 64 MiB.');
  const selected = new Uint8Array(input.bytes);
  const fileName = input.name.replace(/\\/g, '/').split('/').pop()?.replace(/[\u0000-\u001f\u007f]/g, '�').slice(0, 255) || 'module.sqlite';
  const compressed = selected[0] === 31 && selected[1] === 139;
  const raw = compressed ? await gunzipBounded(selected, MAX_READING_BYTES, signal) : selected;
  checkCancelled(signal);
  const detected = physicalType(sql, raw);
  const kind = chosenKind ?? (detected === 'journal' ? 'book' : detected);
  const journalKind = kind === 'book' || kind === 'devotional' || kind === 'graphics';
  if (detected === 'journal' ? !journalKind : detected !== kind)
    throw new Error('The chosen reader type does not match the module schema.');
  const sourceSha256 = await sha256(selected), databaseSha256 = await sha256(raw);
  checkCancelled(signal);
  const module = await normalizeModuleContent(sql, raw, {
    id: localModuleId(kind, databaseSha256), type: kind, title: fileName, sourcePage: '', sha256: sourceSha256
  }, signal);
  module.provenance = {kind: 'local-file', fileName, sourceSha256, databaseSha256, compressed, citation: ''};
  validateReadingContent(module);
  const preparedBytes = new TextEncoder().encode(JSON.stringify(module)).length;
  if (preparedBytes > MAX_READING_BYTES) throw new Error('Prepared module exceeds the 64 MiB storage limit.');
  checkCancelled(signal);
  return {module, selectedBytes: selected.length, databaseBytes: raw.length, preparedBytes};
}

/** Returns detached review data, never the mutable prepared package. */
export function localImportPreview(prepared: PreparedLocalModule, ticket: string): LocalImportPreview {
  const {module} = prepared, origin = module.provenance!;
  return {ticket, id: module.id, kind: module.kind, title: module.title, author: module.author, version: module.version,
    abbreviation: module.metadata?.abbreviation ?? '', language: module.metadata?.language ?? '',
    fileName: origin.fileName, sourceSha256: origin.sourceSha256, databaseSha256: origin.databaseSha256, compressed: origin.compressed,
    selectedBytes: prepared.selectedBytes, databaseBytes: prepared.databaseBytes, preparedBytes: prepared.preparedBytes,
    entryCount: module.entries.length, imageCount: new Set(Object.values(module.images)).size, notice: module.notice,
    samples: module.entries.slice(0, 3).map(entry => ({title: entry.title, text: modulePlainText(entry).slice(0, 600)}))};
}
