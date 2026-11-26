import {describe,it,expect} from 'vitest';
import {commentaryForPassage,commentarySectionsForPassage,dictionaryHeadwords} from '../src/core/installed-study';
import {parseReference} from '../src/core/references';
import type {ReadingEntry} from '../src/core/reading-modules';
const entry=(key:string,chapter:number,verse:number,endVerse=verse):ReadingEntry=>({key,title:key,blocks:[],reference:{book:43,chapter,verse,endVerse}});
describe('installed study selection',()=>{
 it('keeps selected-verse commentary ahead of separately available introductions without changing source order',()=>{
  const entries=[entry('book intro',0,0),entry('chapter intro',3,0),entry('range',3,14,17),entry('exact',3,16),entry('next',3,18),entry('other chapter',4,1)];
  const before=JSON.stringify(entries);
  const sections=commentarySectionsForPassage(entries,parseReference('John 3:16'));
  expect(sections.passage.map(e=>e.key)).toEqual(['range','exact']);
  expect(sections.introductions.map(e=>e.key)).toEqual(['book intro','chapter intro']);
  expect(JSON.stringify(entries)).toBe(before);
  expect(sections.passage[0]).toBe(entries[2]);
  expect(commentarySectionsForPassage(entries,parseReference('John 3')).passage.map(e=>e.key)).toEqual(['range','exact','next']);
 });
 it('does not present an introduction as verse-specific commentary when no matching note exists',()=>{
  const entries=[entry('book intro',0,0),entry('chapter intro',3,0),entry('other verse',3,18)];
  expect(commentarySectionsForPassage(entries,parseReference('John 3:16'))).toEqual({passage:[],introductions:entries.slice(0,2)});
  expect(commentarySectionsForPassage(entries,parseReference('Genesis 3:16'))).toEqual({passage:[],introductions:[]});
 });
 it('includes book/chapter introductions and every overlapping source range without remapping',()=>{
  const entries=[entry('book intro',0,0),entry('chapter intro',3,0),entry('range',3,14,17),entry('next',3,18,20),entry('other chapter',4,1)];
  expect(commentaryForPassage(entries,parseReference('John 3:16-18')).map(e=>e.key)).toEqual(['book intro','chapter intro','range','next']);
  expect(commentaryForPassage(entries,parseReference('John 3')).map(e=>e.key)).toEqual(['book intro','chapter intro','range','next']);
  expect(commentaryForPassage(entries,parseReference('Genesis 3:16'))).toEqual([]);
 });
 it('finds bounded headword pages with exact matches first and no invented Strong’s conversion',()=>{
  const entries=['Abraham’s bosom','Abraham','Abram','H430'].map((title,i)=>({key:String(i),title,blocks:[]}));
  expect(dictionaryHeadwords(entries,' abraham ',0,1)).toMatchObject({total:2,entries:[{title:'Abraham'}]});
  expect(dictionaryHeadwords(entries,'abraham',1,1).entries[0].title).toBe('Abraham’s bosom');
  expect(dictionaryHeadwords(entries,'G25').total).toBe(0);
  expect(dictionaryHeadwords(entries,'',0,2)).toMatchObject({total:4,entries:[{title:'Abraham’s bosom'},{title:'Abraham'}]});
 });
});
