import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasm from '../../assets/sql-wasm.wasm';

let engine: Promise<SqlJsStatic> | undefined;

export function loadBundledSqlite(): Promise<SqlJsStatic> {
  return engine ??= initSqlJs({ wasmBinary: wasm.buffer }).catch(error => {
    engine = undefined;
    throw error;
  });
}
