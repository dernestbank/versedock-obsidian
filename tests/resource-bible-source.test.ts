import {describe,it,expect} from 'vitest';
import {resourceBibleSource} from '../src/core/resource-bible-source';
import {decodeImportedVerse} from '../src/core/imported-study-content';

describe('retained imported Bible annotations',()=>{
 it('keeps notes and headings outside Scripture text while exposing their exact source',()=>{
  const source='Text<RF q=a>Note <FI>supplied<Fi><Rf><TS1>Heading<Ts><RX43.3.16-18>';
  const verse=decodeImportedVerse(1,source);expect(verse.source).toBe(source);expect(verse.text).not.toContain('Note');
  const details=resourceBibleSource(source);
  expect(details.annotations).toEqual([{kind:'note',source:'Note <FI>supplied<Fi>'},{kind:'heading',source:'Heading'}]);
  expect(details.references).toEqual([{start:{book:43,chapter:3,verse:16},end:{book:43,chapter:3,verse:18}}]);
 });
 it('reports unsupported/malformed markup while retaining original source visibility',()=>{
  expect(resourceBibleSource('Text<UNKNOWN>tail').issues.length).toBeGreaterThan(0);
  expect(resourceBibleSource('Text<RF>note').issues.length).toBeGreaterThan(0);
 });
});
