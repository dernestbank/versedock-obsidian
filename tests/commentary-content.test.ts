import {describe,expect,it} from 'vitest';
import {parseCommentarySource,parseOsisResourceReference} from '../src/core/commentary-content';
import {resourceContentText,type ResourceNode} from '../src/core/resource-content';

function nodesOf(nodes:ResourceNode[]):ResourceNode[]{return nodes.flatMap(node=>[node,...('children' in node?nodesOf(node.children):[])]);}
describe('bundled OSIS commentary content',()=>{
 it('preserves source words, inline emphasis, small caps, headings and quotation blocks',()=>{
  const source='<title>A <hi type="italic">heading</hi></title><div sID="a"/><hi type="super">1</hi> First <hi type="small-caps">Lord</hi> <hi type="super">2</hi> second<div eID="a"/><div sID="b"/>Keep <hi type="bold">bold &amp; <hi type="italic">nested</hi></hi> <hi type="underline">underlined</hi>.';
  const doc=parseCommentarySource(source);
  expect(doc.complete).toBe(true);expect(doc.issues).toEqual([]);
  expect(doc.blocks.map(block=>[block.kind,block.text])).toEqual([['heading','A heading'],['quotation','1 First Lord 2 second'],['paragraph','Keep bold & nested underlined.']]);
  const nodes=doc.blocks.flatMap(block=>nodesOf(block.nodes??[]));
  expect(nodes).toContainEqual(expect.objectContaining({type:'element',tag:'em'}));
  expect(nodes).toContainEqual(expect.objectContaining({type:'element',tag:'strong'}));
  expect(nodes).toContainEqual(expect.objectContaining({type:'element',tag:'span',smallCaps:true}));
  expect(nodes).toContainEqual(expect.objectContaining({type:'element',tag:'sup'}));
  expect(doc.blocks.map(block=>resourceContentText({nodes:block.nodes!,issues:[],complete:true}).trim())).toEqual(doc.blocks.map(block=>block.text));
 });
 it('retains single, cross-chapter and multiple qualified source references without guessing',()=>{
  expect(parseOsisResourceReference('Ge.17.20')).toMatchObject({kind:'scripture',range:{start:{book:1,chapter:17,verse:20}}});
  expect(parseOsisResourceReference('Php.3.3')).toMatchObject({kind:'scripture',range:{start:{book:50,chapter:3,verse:3}}});
  expect(parseOsisResourceReference('John.3.16-John.4.2')).toMatchObject({kind:'scripture',range:{start:{book:43,chapter:3,verse:16},end:{book:43,chapter:4,verse:2}}});
  expect(parseOsisResourceReference('John.3.16 1Cor.13.4-1Cor.13.7')).toMatchObject({range:{start:{book:43}},additionalRanges:[{start:{book:46,chapter:13,verse:4},end:{book:46,chapter:13,verse:7}}]});
  const doc=parseCommentarySource('<reference osisRef="Ps.42.7 Ps.69.2">the Psalms</reference> and <reference osisRef="John.3.16">John</reference>.');
  const links=nodesOf(doc.blocks[0].nodes!).filter(node=>node.type==='link');
  expect(links).toHaveLength(2);expect(links[0]).toMatchObject({target:{kind:'scripture',additionalRanges:[{start:{book:19,chapter:69,verse:2}}]}});
  expect(doc.blocks[0].text).toBe('the Psalms and John.');
  for(const value of ['21.13','John.3.16 garbage','John.3.18-John.3.16','Matt.0.1','Unknown.1.1','John.3.16/javascript:bad','John.3.16\nhttps://evil.invalid',Array(34).fill('John.3.16').join(' ')])expect(parseOsisResourceReference(value),value).toBeNull();
 });
 it('keeps hostile markup and duplicate source reference attributes inert and exposes limits',()=>{
  const doc=parseCommentarySource('<reference osisRef="John.3.16" osisRef="Gen.1.1" onclick="bad()">label</reference><script>bad()</script><hi type="constructor">text</hi>');
  const nodes=doc.blocks.flatMap(block=>nodesOf(block.nodes??[]));
  expect(nodes.filter(node=>node.type==='link').every(node=>node.target===null)).toBe(true);
  expect(nodes.filter(node=>node.type==='element').every(node=>['span','em','strong','sup','u'].includes(node.tag))).toBe(true);
  expect(doc.issues.length).toBeGreaterThan(0);
  expect(parseCommentarySource('x'.repeat(1024*1024+1))).toMatchObject({complete:false,blocks:[]});
  expect(parseCommentarySource('<hi type="italic">'.repeat(34)+'word')).toMatchObject({complete:false,blocks:[]});
  expect(parseCommentarySource('word<hi type="italic">x</hi>'.repeat(10001))).toMatchObject({complete:false,blocks:[]});
 });
});
