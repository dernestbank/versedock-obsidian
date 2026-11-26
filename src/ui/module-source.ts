import { moduleSourceNotice } from '../core/module-provenance';
import type { ReadingModule } from '../core/reading-modules';

export function renderModuleSource(parent: HTMLElement, module: ReadingModule): void {
  parent.createEl('p', {text: moduleSourceNotice(module) || module.title + ' · ' + module.author});
  if (module.sourcePage) parent.createEl('a', {text: 'Publisher source page', attr: {href: module.sourcePage, target: '_blank', rel: 'noreferrer'}});
  else if (module.provenance) {
    parent.createEl('p', {cls: 'vd-subtle', text: 'Source SHA-256: ' + module.provenance.sourceSha256});
    parent.createEl('p', {cls: 'vd-subtle', text: 'Database SHA-256: ' + module.provenance.databaseSha256});
  }
}
