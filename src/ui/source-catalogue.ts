import type { SwordDockController } from '../controller';
import { textButton } from './components';
import { DiscoveryWizard } from './discovery-wizard';

export function renderSourceCatalogue(parent: HTMLElement, plugin: SwordDockController): () => void {
  const section = parent.createDiv({ cls: 'vd-catalogue' });
  section.createEl('h3', { text: 'Publisher modules' });
  section.createEl('p', {
    cls: 'vd-subtle',
    text: 'Search MySword and third-party collections. Choose modules to install in this vault for offline reading.',
  });
  textButton(section, 'Discover modules', () => new DiscoveryWizard(plugin).open(), 'mod-cta');
  return () => {};
}
