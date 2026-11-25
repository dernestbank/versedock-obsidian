import {describe,expect,it} from 'vitest';
import {parseResourceLink,resourceRangeLabel,ResourceEntryIndex} from '../src/core/resource-links';
import type {ReadingModule} from '../src/core/reading-modules';

describe('MySword resource addresses',()=>{
 it('preserves numeric/text references, explicit editions and cross-chapter ranges',()=>{
  expect(parseResourceLink('#b43.3.16-43.3.18')).toEqual({kind:'scripture',range:{start:{book:43,chapter:3,verse:16},end:{book:43,chapter:3,verse:18}}});
  expect(parseResourceLink('bJoh 3:16-18/KJV')).toMatchObject({kind:'scripture',edition:'KJV',range:{start:{book:43,chapter:3,verse:16},end:{book:43,chapter:3,verse:18}}});
  expect(parseResourceLink('#b43.3.16.KJV')).toMatchObject({edition:'KJV'});
  expect(parseResourceLink('#b2.30.1-2.31.18')).toMatchObject({range:{start:{book:2,chapter:30,verse:1},end:{book:2,chapter:31,verse:18}}});
  expect(parseResourceLink('#bJohn 3:16-4:2')).toMatchObject({range:{end:{book:43,chapter:4,verse:2}}});
  expect(parseResourceLink('bJoh 3:16&w=1')).toMatchObject({wholeChapter:true});
  expect(parseResourceLink('#b3.8.0')).toEqual({kind:'scripture',range:{start:{book:3,chapter:8}}});
  expect(resourceRangeLabel({start:{book:2,chapter:30,verse:1},end:{book:2,chapter:31,verse:18}})).toBe('Exodus 30:1–31:18');
 });
 it('keeps Journal IDs, escaped punctuation, fragments and dictionary words distinct',()=>{
  expect(parseResourceLink('#j Paul%27s Travels#Top')).toEqual({kind:'entry',collection:'journal',id:"Paul's Travels",anchor:'Top'});
  expect(parseResourceLink('#j-Other Index#Jan')).toMatchObject({module:'Other',id:'Index',anchor:'Jan'});
  expect(parseResourceLink('#j-Contents')).toEqual({kind:'entry',collection:'journal',id:'Contents'});
  expect(parseResourceLink('#dKing')).toEqual({kind:'entry',collection:'dictionary',id:'King'});
  expect(parseResourceLink('#c1.1.11')).toMatchObject({kind:'commentary',range:{start:{book:1,chapter:1,verse:11}}});
  expect(parseResourceLink('#Top')).toEqual({kind:'anchor',id:'Top'});
  expect(parseResourceLink('rA note')).toEqual({kind:'note',text:'A note'});
 });
 it('keeps invalid coordinates, unsafe URLs and malformed escapes inert',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,hi','file:///tmp/a','obsidian://open','https://u:p@example.com/x','https://example.com/\nfoo','#b67.1.1','#b1.0.1','#b1.1.9-1.1.2','#j A%ZZ','#j A%0ab','#b1.1.1?x=1'])expect(parseResourceLink(href),href).toBeNull();
  expect(parseResourceLink('https://example.com/help?q=one')).toEqual({kind:'external',url:'https://example.com/help?q=one'});
 });
 it('resolves exact retained topic IDs and dictionary keys without guessing duplicate titles',()=>{
  const module={kind:'book',entries:[{key:'1',title:'A displayed title',sourceId:'Real topic',blocks:[]},{key:'2',title:'A displayed title',sourceId:'Other',blocks:[]}]} as unknown as ReadingModule;
  const index=new ResourceEntryIndex(module);
  expect(index.resolve({kind:'entry',collection:'journal',id:'Real topic'})).toMatchObject({entries:[{key:'1'}]});
  expect(index.resolve({kind:'entry',collection:'journal',id:'A displayed title'})).toMatchObject({entries:[],reason:expect.any(String)});
  const legacy=new ResourceEntryIndex({...module,entries:[{key:'1',title:'Real topic',blocks:[]}]});
  expect(legacy.resolve({kind:'entry',collection:'journal',id:'Real topic'}).reason).toMatch(/reinstall|source ID/i);
  const dictionary=new ResourceEntryIndex({kind:'dictionary',entries:[{key:'king',title:'King',blocks:[]}]} as unknown as ReadingModule);
  expect(dictionary.resolve({kind:'entry',collection:'dictionary',id:'KING'}).entries[0].key).toBe('king');
  expect(index.resolve({kind:'entry',collection:'dictionary',id:'Real topic'}).entries).toEqual([]);
 });
});
