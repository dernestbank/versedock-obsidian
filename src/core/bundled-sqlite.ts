import initSqlJs, { type SqlJsStatic } from 'sql.js';

let engine: Promise<SqlJsStatic> | undefined;

export function loadBundledSqlite(): Promise<SqlJsStatic> {
  return engine ??= import('../../assets/sql-wasm.wasm').then(({default: wasm}) => initSqlJs({ wasmBinary: wasm.buffer })).catch(error => {
    engine = undefined;
    throw error;
  });
}
