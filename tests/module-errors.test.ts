import {describe,it,expect} from 'vitest';
import {moduleFailureMessage} from '../src/core/module-errors';
describe('module failure guidance',()=>{
 it('removes filesystem paths and distinguishes access from full storage, including serialized errors',()=>{
  for(const code of ['EACCES','EPERM','EROFS']){
   const message=moduleFailureMessage(Object.assign(new Error(code+": denied '/Users/private/vault'"),{code}),'Failed.');
   expect(message).toMatch(/write permission/i);expect(message).not.toContain('/Users');
  }
  expect(moduleFailureMessage(new Error("ENOSPC: write '/private/file'"),'Failed.')).toMatch(/free.*space/i);
  expect(moduleFailureMessage({code:'EDQUOT',message:'/private/file'},'Failed.')).toMatch(/free.*space/i);
  expect(moduleFailureMessage(new Error("EIO: read '/private/file'"),'Failed.')).not.toContain('/private');
 });
 it('retains actionable validation and cancellation messages and uses the supplied fallback for unknown values',()=>{
  for(const message of ['Publisher file changed or failed its checksum. No module was activated.','Installation cancelled.','Review this file in a fresh preview before installing.'])expect(moduleFailureMessage(new Error(message),'Failed.')).toBe(message);
  expect(moduleFailureMessage(null,'Local import failed.')).toBe('Local import failed.');
 });
});
