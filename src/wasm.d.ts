declare module '*.wasm' {
  const bytes: Uint8Array<ArrayBuffer>;
  export default bytes;
}

declare module "*.svg?raw" {
  const source: string;
  export default source;
}
