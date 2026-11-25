import {describe,it,expect} from 'vitest';
import {extendReferenceToVerse,parseReference,parseOsis,referenceId,storedReferencesContainVerse} from '../src/core/references';
import {normalizeReadingHistory,recordReadingHistory} from '../src/core/reading-history';

const selected=()=>extendReferenceToVerse(parseReference('Psalm 119:1'),176);
describe('long same-chapter Reader selection persistence',()=>{
 it('restores a complete Psalm 119 selection created by Reader range extension',()=>{
  const ref=selected(),saved=referenceId(ref);
  expect(saved).toBe('Ps.119.1-176');expect(parseOsis(saved)).toEqual(ref);
 });
 it('recognizes a saved long bookmark/highlight at its final verse',()=>{
  expect(storedReferencesContainVerse([referenceId(selected())],parseReference('Psalm 119:176'))).toBe(true);
 });
 it('records and reloads long selections in recent reading history',()=>{
  const ref=selected(),saved=referenceId(ref);
  expect(recordReadingHistory([],ref)).toEqual([saved]);
  expect(normalizeReadingHistory([saved])).toEqual([saved]);
 });
 it.each(['Psalm 119:176-1','Psalm 119:1-201'])('still rejects reversed or out-of-bound coordinates: %s',input=>{
  expect(()=>parseReference(input)).toThrow();
 });
});
