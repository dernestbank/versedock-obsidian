import { checkCancelled, MAX_READING_BYTES } from './reading-modules';
export interface ArchiveMember {
  name: string;
  unpack: (signal: AbortSignal) => Promise<Uint8Array>;
}
const crcTable = Uint32Array.from({ length: 256 }, (_, i) => {
  for (let j = 0; j < 8; j++) i = (i >>> 1) ^ (i & 1 ? 0xedb88320 : 0);
  return i >>> 0;
});

/** Inspect the central directory first. Decompress only explicitly selected SQLite members in memory. */
export function moduleMembers(bytes: Uint8Array, name: string): ArchiveMember[] {
  if (!bytes.length || bytes.length > MAX_READING_BYTES)
    throw Error('Download exceeds the 64 MiB limit or is empty.');
  if (bytes[0] !== 80 || bytes[1] !== 75)
    return [
      {
        name,
        unpack: async (signal) => {
          checkCancelled(signal);
          return bytes;
        },
      },
    ];
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (i: number) => v.getUint16(i, true),
    u32 = (i: number) => v.getUint32(i, true);
  let end = bytes.length - 22;
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    (u32(end) !== 0x06054b50 || end + 22 + u16(end + 20) !== bytes.length)
  )
    end--;
  if (
    end < Math.max(0, bytes.length - 65557) ||
    u16(end + 4) ||
    u16(end + 6) ||
    u16(end + 8) !== u16(end + 10) ||
    u16(end + 10) > 512
  )
    throw Error('Unsupported or incomplete ZIP directory.');
  let offset = u32(end + 16),
    total = 0;
  if (offset + u32(end + 12) !== end) throw Error('Invalid ZIP directory size.');
  const members: ArchiveMember[] = [],
    names = new Set<string>();
  for (let i = 0; i < u16(end + 10); i++) {
    if (offset + 46 > end || u32(offset) !== 0x02014b50) throw Error('Invalid ZIP member directory.');
    const flags = u16(offset + 8),
      method = u16(offset + 10),
      crc = u32(offset + 16),
      length = u32(offset + 20),
      size = u32(offset + 24);
    const nameLength = u16(offset + 28),
      local = u32(offset + 42);
    const member = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + u16(offset + 30) + u16(offset + 32);
    total += size;
    if (offset > end || total > MAX_READING_BYTES) throw Error('Expanded ZIP exceeds the supported limit.');
    if (
      !/\.(?:mybible|sqlite)(?:\.gz)?$/i.test(member) ||
      member.startsWith('__MACOSX/') ||
      member.split('/').some((p) => p.startsWith('._'))
    )
      continue;
    if (
      !member ||
      member.length > 255 ||
      /[\\:\x00-\x1f]/.test(member) ||
      member.split('/').some((p) => !p || p === '.' || p === '..') ||
      names.has(member)
    )
      throw Error('Invalid or duplicate ZIP module name.');
    names.add(member);
    if (flags & 1 || ![0, 8].includes(method)) throw Error('ZIP uses encryption or unsupported compression.');
    if (local + 30 > end || u32(local) !== 0x04034b50 || u16(local + 8) !== method)
      throw Error('Invalid ZIP member header.');
    const start = local + 30 + u16(local + 26) + u16(local + 28);
    if (start + length > u32(end + 16)) throw Error('Incomplete ZIP member.');
    members.push({
      name: member,
      unpack: async (signal) => {
        checkCancelled(signal);
        const source = new Blob([new Uint8Array(bytes.subarray(start, start + length))]).stream();
        const reader = (
          method === 0 ? source : source.pipeThrough(new DecompressionStream('deflate-raw'))
        ).getReader();
        const output = new Uint8Array(size);
        let pos = 0,
          sum = 0xffffffff;
        try {
          for (;;) {
            checkCancelled(signal);
            const chunk = await reader.read();
            if (chunk.done) break;
            if (pos + chunk.value.length > size) throw Error('ZIP member exceeds its declared size.');
            output.set(chunk.value, pos);
            pos += chunk.value.length;
            for (const byte of chunk.value) sum = (sum >>> 8) ^ crcTable[(sum ^ byte) & 255];
          }
        } finally {
          await reader.cancel().catch(() => {});
        }
        if (pos !== size || (sum ^ 0xffffffff) >>> 0 !== crc) throw Error('ZIP member checksum failed.');
        return output;
      },
    });
  }
  if (!members.length) throw Error('ZIP contains no supported MySword modules.');
  return members;
}
