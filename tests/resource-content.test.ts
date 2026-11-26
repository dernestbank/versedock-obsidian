import {describe,expect,it} from 'vitest';
import {parseResourceContent,resourceContentText,RESOURCE_TAGS} from '../src/core/resource-content';

describe('inert rich resource content',()=>{
 it('resolves explicitly declared local fragments before module syntax and refuses duplicate anchors',()=>{
  const doc=parseResourceContent('<a href="#chapter1">Chapter</a><a id="chapter1" name="oldChapter"></a><a href="#oldChapter">Old</a>',{});
  expect(doc.nodes.filter(node=>node.type==='link').map(node=>node.target)).toEqual([{kind:'anchor',id:'chapter1'},{kind:'anchor',id:'oldChapter'}]);
  expect(doc.issues).toEqual([]);
  const duplicate=parseResourceContent('<a href="#dWord">Word</a><a name="dWord"></a><a name="dWord"></a>',{});
  expect(duplicate.nodes.find(node=>node.type==='link')).toMatchObject({target:null});
  expect(duplicate.issues.join(' ')).toMatch(/ambiguous/i);
  const attributes=parseResourceContent('<a href="#chapter1" href="#other">Chapter</a><a name="chapter1"></a>',{});
  expect(attributes.nodes.find(node=>node.type==='link')).toMatchObject({target:null});
 });
 it('does not treat inherited object properties as allowed tags or entities',()=>{
  const doc=parseResourceContent('<constructor>Safe &constructor;</constructor>',{});
  expect(resourceContentText(doc)).toContain('Safe &constructor;');
  for(const node of doc.nodes)if(node.type==='element')expect(RESOURCE_TAGS).toContain(node.tag);
  expect(doc.issues.length).toBeGreaterThan(0);
 });
 it('retains semantic formatting, lists, tables, anchors and real links',()=>{
  const doc=parseResourceContent('<h2>Heading</h2><p><strong>Bold</strong> <em>words</em><br>line &amp; &Alpha;</p><ol start="3"><li>One</li><li>Two</li></ol><blockquote>Quote</blockquote><table><tr><th>Key</th><td>Value</td></tr></table><a name="Top"></a><a href="#j Contents">Contents</a>',{});
  expect(doc.complete).toBe(true);
  expect(doc.nodes).toContainEqual(expect.objectContaining({type:'element',tag:'h2'}));
  expect(doc.nodes).toContainEqual(expect.objectContaining({type:'element',tag:'ol',start:3}));
  expect(doc.nodes).toContainEqual({type:'anchor',name:'Top'});
  expect(doc.nodes).toContainEqual(expect.objectContaining({type:'link',target:{kind:'entry',collection:'journal',id:'Contents'}}));
  expect(doc.nodes.filter(node=>node.type==='link')).toHaveLength(1);
  expect(resourceContentText(doc)).toContain('line & Α');
 });
 it('never creates source DOM/CSS/remote requests and preserves unsupported source visibility',()=>{
  const doc=parseResourceContent('<script>steal()</script><svg><script>x</script></svg><p onclick="bad()" style="background:url(https://bad)">Safe <a href="javascript:bad()">label</a></p><img src="https://bad/x"><img src="local.png" onerror="bad()">',{ 'local.png':{mime:'image/png',base64:'iVBORw0KGgo='}});
  expect(resourceContentText(doc)).toContain('Safe label');expect(resourceContentText(doc)).not.toContain('steal');
  expect(JSON.stringify(doc.nodes)).not.toMatch(/onclick|onerror|background|https:\/\/bad/);
  expect(doc.nodes).toContainEqual({type:'image',image:'local.png',caption:''});
  expect(doc.issues.length).toBeGreaterThan(0);
 });
 it('handles malformed publisher nesting without dropping ordinary text or interpreting escaped tags',()=>{
  const doc=parseResourceContent('<table><tr><td><p>A</td><td><strong>B</td></tr></table><p>C &lt;script&gt;x&lt;/script&gt;</p>',{});
  expect(resourceContentText(doc).replace(/\s+/g,' ').trim()).toBe('A B C <script>x</script>');
  expect(doc.complete).toBe(true);
 });
 it('bounds parser work and explicitly requests the full retained-source fallback',()=>{
  const deep=parseResourceContent('<div>'.repeat(1000)+'Keep me'+'</div>'.repeat(1000),{});
  expect(deep.complete).toBe(false);expect(deep.issues.join(' ')).toMatch(/limit/i);
  expect(parseResourceContent('x'.repeat(1024*1024+1),{}).complete).toBe(false);
  expect(parseResourceContent('<br>'.repeat(21000),{}).complete).toBe(false);
 });
});
