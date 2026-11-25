import {describe,it,expect} from 'vitest';
import {readingReflectionFileName,readingReflectionMarkdown} from '../src/core/reading-reflection';
import type {ReadingModule} from '../src/core/reading-modules';
const module:ReadingModule={format:1,id:'local-devotional-'+ 'a'.repeat(24),kind:'devotional',title:'Title\n![image](remote)',author:'',version:'1',sourcePage:'',sourceSha256:'a'.repeat(64),notice:'',images:{},entries:[],
 provenance:{kind:'local-file',fileName:'owned.mybible',sourceSha256:'a'.repeat(64),databaseSha256:'a'.repeat(64),compressed:false,citation:'Local permission note'}};
const entry={key:'1',title:'Entry / name\u0000',blocks:[]};
describe('imported devotional reflection notes',()=>{
 it('keeps source metadata inert and retains local provenance in the note',()=>{
  const markdown=readingReflectionMarkdown(module,entry);
  expect(markdown).toContain('\\!\\[image\\]');expect(markdown).toContain('Local file · owned.mybible');
  expect(markdown).toContain('Local permission note');expect(markdown.split('\n').filter(line=>line.startsWith('# '))).toHaveLength(1);
 });
 it('derives a bounded filename without paths or control characters',()=>{
  expect(readingReflectionFileName(module,entry)).not.toMatch(/[\u0000-\u001f/\\]/);
  expect(readingReflectionFileName({...module,title:'x'.repeat(300)},entry).length).toBeLessThanOrEqual(173);
 });
});
