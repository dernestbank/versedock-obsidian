import { Platform, requestUrl } from 'obsidian';
import { sourceUrl, type Collection } from '../core/discovery-sources';
import { checkCancelled } from '../core/reading-modules';

export async function readPublisher(
  c: Collection,
  url: string,
  limit: number,
  signal: AbortSignal,
  progress?: (n: number) => void,
): Promise<Uint8Array> {
  const allowed = sourceUrl(c, url, c.url, !!progress);
  if (allowed !== url) throw Error('Unrecognized publisher address.');
  checkCancelled(signal);
  if (Platform.isDesktopApp) {
    const https = require('node:https') as typeof import('node:https');
    const read = async (current: string, remaining: number): Promise<Uint8Array> => {
      const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
        const req = https.get(
          current,
          { signal, headers: { 'Accept-Encoding': 'identity' }, timeout: 25000 },
          resolve,
        );
        req.on('timeout', () => req.destroy(Error('Publisher timed out.')));
        req.on('error', reject);
      });
      try {
        if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
          const redirect =
            response.headers.location && sourceUrl(c, response.headers.location, current, !!progress);
          if (!remaining || !redirect) throw Error('Unsupported publisher redirect.');
          return await read(redirect, remaining - 1);
        }
        if (response.statusCode !== 200) throw Error('Publisher returned HTTP ' + response.statusCode + '.');
        if (Number(response.headers['content-length']) > limit)
          throw Error('Publisher file exceeds the size limit.');
        const chunks: Uint8Array[] = [];
        let total = 0;
        for await (const part of response) {
          checkCancelled(signal);
          total += part.length;
          if (total > limit) throw Error('Publisher file exceeds the size limit.');
          chunks.push(part);
          progress?.(total);
        }
        const out = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          out.set(chunk, offset);
          offset += chunk.length;
        }
        return out;
      } finally {
        response.destroy();
      }
    };
    return read(allowed, 3);
  }
  // Obsidian's native mobile request can bypass publisher CORS. Bound the advertised
  // size before requesting binary content, then check the actual decoded body.
  let timer: ReturnType<typeof setTimeout> | undefined,
    cancel = () => {};
  const interruption = new Promise<never>((_, reject) => {
    cancel = () => reject(Error('Installation cancelled.'));
    signal.addEventListener('abort', cancel, { once: true });
    timer = setTimeout(() => reject(Error('Publisher timed out.')), 45000);
  });
  try {
    if (progress) {
      const head = await Promise.race([requestUrl({ url, method: 'HEAD', throw: false }), interruption]);
      const length = Number(
        Object.entries(head.headers).find(([k]) => k.toLowerCase() === 'content-length')?.[1],
      );
      if (head.status !== 200 || !Number.isSafeInteger(length) || length <= 0 || length > limit)
        throw Error('Publisher could not confirm a supported file size for mobile.');
    }
    checkCancelled(signal);
    const response = await Promise.race([requestUrl({ url, throw: false }), interruption]);
    if (response.status !== 200) throw Error('Publisher returned HTTP ' + response.status + '.');
    const bytes = new Uint8Array(response.arrayBuffer);
    if (bytes.length > limit) throw Error('Publisher file exceeds the size limit.');
    checkCancelled(signal);
    progress?.(bytes.length);
    return bytes;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
