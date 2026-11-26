/** Adapter errno messages contain local paths; keep those out of user-facing job/dialog text. */
export function moduleFailureMessage(error:unknown,fallback:string):string {
 const message=error instanceof Error?error.message:fallback;
 const supplied=error&&typeof error==='object'&&'code' in error?error.code:undefined;
 const code=typeof supplied==='string'?supplied:/^(E[A-Z0-9_]+):/.exec(message)?.[1];
 if(code&&['EACCES','EPERM','EROFS'].includes(code))return 'Unable to save the resource. Check this vault’s write permission, then retry.';
 if(code&&['ENOSPC','EDQUOT'].includes(code))return 'Unable to save the resource. Free some disk space, then retry.';
 if(code&&['EIO','ENOENT','ENOTDIR','EISDIR','EMFILE','ENFILE','EEXIST'].includes(code))return 'Resource storage is unavailable or changed. Check the vault storage, then retry.';
 return message;
}
