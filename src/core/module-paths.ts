export const isModuleDirectory=(value:string):boolean=>/^[a-z0-9][a-z0-9-]{0,79}-[a-f0-9]{16}(?:-r-[a-f0-9]{8})?$/.test(value);
export const isStageDirectory=(value:string):boolean=>/^\.stage-[a-f0-9-]{36}$/.test(value);
export const isStateDirectory=(value:string):boolean=>/^\.state-\d{12}-[a-f0-9]{16}$/.test(value);
export const isStorageLeaf=(value:string):boolean=>value!=='.'&&value!=='..'&&/^[^/\\\u0000]{1,255}$/.test(value);
