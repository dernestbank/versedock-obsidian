import {defineConfig} from 'vitest/config';

export default defineConfig({test:{
 // Full-corpus checksum/SQLite checks compete for substantial memory and I/O.
 // Bound the worker pool so they can run alongside native Obsidian verification.
 maxWorkers:2,
 testTimeout:15000
}});
