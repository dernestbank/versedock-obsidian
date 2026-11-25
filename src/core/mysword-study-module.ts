import type { Database, SqlJsStatic } from 'sql.js';
import { checkCancelled, MAX_READING_BYTES } from './reading-modules';
import {readModuleSourceMetadata,type ModuleSourceMetadata} from './module-source-metadata';

export type StudyModuleKind = 'bible' | 'commentary' | 'dictionary';
export type StudyRecord =
 | {kind:'bible';key:string;book:number;chapter:number;verse:number;source:string}
 | {kind:'commentary';key:string;book:number;chapter:number;fromVerse:number;toVerse:number;source:string}
 | {kind:'dictionary';key:string;word:string;source:string};
export interface InspectedStudyModule {kind:StudyModuleKind;metadata:ModuleSourceMetadata;records:StudyRecord[];warnings:string[]}
const TABLES={bible:'Bible',commentary:'Commentary',dictionary:'Dictionary'} as const;
function columns(db:Database,table:'Details'|'Bible'|'Commentary'|'Dictionary'):Set<string>{
 return new Set(db.exec(`PRAGMA table_info("${table}")`)[0]?.values.map(row=>String(row[1]).toLowerCase())??[]);
}
function text(value:unknown,max:number,label:string):string{
 if(typeof value!=='string' || value.length>max)throw new Error('Invalid '+label+' text.');return value;
}
function integer(value:unknown,min:number,max:number,label:string):number{
 if(typeof value!=='number' || !Number.isSafeInteger(value) || value<min || value>max)throw new Error('Unsupported '+label+' coordinate.');return value;
}
/** Schema validation only: source markup/rules remain inert and are never evaluated. */
export async function inspectStudyModule(sql:SqlJsStatic,bytes:Uint8Array,kind:StudyModuleKind,signal?:AbortSignal):Promise<InspectedStudyModule>{
 checkCancelled(signal);
 if(bytes.length<100 || bytes.length>MAX_READING_BYTES || new TextDecoder().decode(bytes.slice(0,16))!=='SQLite format 3\0')throw new Error('Expected an unencrypted SQLite module within the supported size limit.');
 const db=new sql.Database(bytes);
 try{
  db.run('PRAGMA trusted_schema=OFF');db.run('PRAGMA query_only=ON');
  if(db.exec('PRAGMA quick_check(1)')[0]?.values[0]?.[0]!=='ok')throw new Error('SQLite module integrity check failed.');
  const tables=new Set(db.exec("SELECT lower(name) FROM sqlite_master WHERE type='table' AND upper(sql) NOT LIKE 'CREATE VIRTUAL%'")[0]?.values.map(row=>String(row[0]))??[]);
  const table=TABLES[kind];if(!tables.has('details') || !tables.has(table.toLowerCase()))throw new Error('Expected physical Details and '+table+' tables.');
  const expected=kind==='bible'?['book','chapter','verse','scripture']:kind==='commentary'?['book','chapter','fromverse','toverse','data']:['word','data'];
  const schema=columns(db,table);if(!expected.every(name=>schema.has(name)))throw new Error('Unsupported '+table+' schema.');
  const details=db.exec('SELECT * FROM Details LIMIT 2')[0];if(!details || details.values.length!==1)throw new Error('Expected exactly one Details record.');
  const fields=Object.fromEntries(details.columns.map((name,i)=>[name.toLowerCase(),details.values[0][i]]));
  const metadata=readModuleSourceMetadata(fields);
  const warnings:string[]=[];
  if(metadata.verseRules)warnings.push('Publisher verse rules are retained as metadata and are not evaluated. Unsupported Bible markers stay visible.');
  if(metadata.customCss)warnings.push('Source CSS is preserved as metadata and is never executed.');
  const query=kind==='bible'?'SELECT Book,Chapter,Verse,Scripture FROM Bible ORDER BY Book,Chapter,Verse LIMIT 100001'
   :kind==='commentary'?'SELECT Book,Chapter,FromVerse,ToVerse,Data FROM Commentary ORDER BY Book,Chapter,FromVerse,ToVerse LIMIT 100001'
   :'SELECT Word,Data FROM Dictionary ORDER BY Word COLLATE NOCASE LIMIT 100001';
  const statement=db.prepare(query);const records:StudyRecord[]=[];const keys=new Set<string>();let size=0;
  try{while(statement.step()){
   checkCancelled(signal);if(records.length>=100000)throw new Error('Module exceeds the supported entry count.');
   const row=statement.get();let record:StudyRecord;
   if(kind==='bible'){
    const book=integer(row[0],1,66,'book'),chapter=integer(row[1],1,200,'chapter'),verse=integer(row[2],1,200,'verse');
    record={kind,key:book+'.'+chapter+'.'+verse,book,chapter,verse,source:text(row[3],32768,'verse')};
   }else if(kind==='commentary'){
    const book=integer(row[0],1,66,'book'),chapter=integer(row[1],0,200,'chapter'),fromVerse=integer(row[2],0,200,'range start'),toVerse=integer(row[3],0,200,'range end');
    if(toVerse<fromVerse || (chapter===0 && (fromVerse!==0 || toVerse!==0)))throw new Error('Invalid commentary range.');
    record={kind,key:book+'.'+chapter+'.'+fromVerse+'-'+toVerse,book,chapter,fromVerse,toVerse,source:text(row[4],1024*1024,'commentary')};
   }else{
    const word=text(row[0],512,'headword').trim();if(!word)throw new Error('Dictionary has an empty headword.');
    record={kind,key:word.normalize('NFKC').toLocaleLowerCase(),word,source:text(row[1],1024*1024,'definition')};
   }
   if(keys.has(record.key))throw new Error('Duplicate or ambiguous source entry: '+record.key);
   keys.add(record.key);size+=record.source.length;if(size>32*1024*1024)throw new Error('Module text exceeds the supported size limit.');
   records.push(record);if(records.length%100===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }}finally{statement.free();}
  if(!records.length)throw new Error('Module has no readable records.');
  return {kind,metadata,records,warnings};
 }finally{db.close();}
}
