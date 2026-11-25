import { markdownInlineText } from './markdown-text';
import { moduleOrigin } from './module-provenance';
import type { ReadingEntry, ReadingModule } from './reading-modules';

export function readingReflectionFileName(module: ReadingModule, entry: ReadingEntry): string {
  return (module.title + ' - ' + entry.title).replace(/[\\/:*?"<>|#\[\]]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 170).replace(/[. ]+$/g, '') + '.md';
}

export function readingReflectionMarkdown(module: ReadingModule, entry: ReadingEntry): string {
  return ['# ' + markdownInlineText(module.title + ' — ' + entry.title), '',
    'Source: ' + markdownInlineText(moduleOrigin(module)), '',
    ...(module.provenance?.citation ? ['Provenance: ' + markdownInlineText(module.provenance.citation), ''] : []),
    '## Reflection', '', ''].join('\n');
}
