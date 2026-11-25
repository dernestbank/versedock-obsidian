import type { SqlJsStatic } from 'sql.js';
import { normalizeReadingModule, type ReadingModule, type ReadingSource } from './reading-modules';
import { inspectStudyModule } from './mysword-study-module';
import { prepareStudyContent } from './imported-study-content';
export async function normalizeModuleContent(sql:SqlJsStatic,bytes:Uint8Array,source:ReadingSource,signal?:AbortSignal):Promise<ReadingModule>{
 if(source.type==='bible'||source.type==='commentary'||source.type==='dictionary')return prepareStudyContent(await inspectStudyModule(sql,bytes,source.type,signal),source,signal);
 return normalizeReadingModule(sql,bytes,source,signal);
}
