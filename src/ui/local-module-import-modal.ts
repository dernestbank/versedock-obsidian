import { Modal } from 'obsidian';
import type { SwordDockController } from '../controller';
import type { LocalImportPreview } from '../core/local-module-import';
import { MAX_READING_BYTES, type ReadingKind } from '../core/reading-modules';
import { RESOURCE_LABELS, RESOURCE_TYPES } from '../core/resource-dock';
import { formatStorageBytes } from '../core/storage';
import { textButton } from './components';
import { MySwordInspectModal } from './mysword-inspect-modal';
import { requestsFocusRestoration, restoreActionFocus } from './focus';

export class LocalModuleImportModal extends Modal {
  private revision = 0;
  private preview: LocalImportPreview | null = null;
  private previewAbort: AbortController | null = null;
  private installing = false;

  constructor(private readonly plugin: SwordDockController) { super(plugin.app); }

  onOpen(): void {
    const root = this.contentEl;
    root.empty(); root.addClass('versedock', 'vd-local-import-modal');
    root.createEl('h2', {text: 'Import a MySword module'});
    root.createEl('p', {cls: 'vd-subtle', text: 'Choose an unencrypted SQLite or gzip file, up to 64 MiB selected and expanded. Review its source and contents before installing in this vault.'});
    const controls = root.createDiv({cls: 'vd-local-import-controls'});
    const fileLabel = controls.createEl('label', {text: 'Local file'});
    const fileInput = fileLabel.createEl('input', {attr: {type: 'file', accept: '.mybible,.sqlite,.db,.gz,application/octet-stream,application/gzip', 'aria-label': 'Choose local MySword module'}});
    const typeLabel = controls.createEl('label', {text: 'Reader type'});
    const typeSelect = typeLabel.createEl('select', {attr: {'aria-label': 'Local module reader type'}});
    typeSelect.createEl('option', {value: 'auto', text: 'Detect from file contents'});
    for (const type of RESOURCE_TYPES) typeSelect.createEl('option', {value: type, text: RESOURCE_LABELS[type]});
    root.createEl('p', {cls: 'vd-subtle', text: 'Book, devotional and graphics resources share a Book container. Choose Devotional for dated readings or Graphics for embedded maps and images.'});
    const status = root.createDiv({cls: 'vd-import-status', attr: {role: 'status', 'aria-live': 'polite'}});
    const result = root.createDiv({cls: 'vd-import-result'});
    status.setText('Select a file to prepare its local preview.');
    const prepare = async (): Promise<void> => {
      if (this.installing) return;
      const revision = ++this.revision;
      this.previewAbort?.abort();
      if (this.preview) this.plugin.modules.discardLocalPreview(this.preview.ticket);
      this.preview = null; result.empty();
      const file = fileInput.files?.[0];
      if (!file) { status.setText('Select a file to prepare its local preview.'); return; }
      if (file.size > MAX_READING_BYTES) { status.setText('Selected file exceeds the 64 MiB import limit.'); return; }
      const abort = new AbortController(); this.previewAbort = abort;
      status.setText('Preparing and validating the selected file locally…');
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (revision !== this.revision) return;
        const preview = await this.plugin.modules.previewLocalFile({name: file.name, bytes},
          typeSelect.value === 'auto' ? undefined : typeSelect.value as ReadingKind, abort.signal);
        if (revision !== this.revision) { this.plugin.modules.discardLocalPreview(preview.ticket); return; }
        this.preview = preview;
        status.setText('Preview ready. Review the source, then choose Install in this vault.');
        this.renderPreview(result, preview, status, fileInput, typeSelect, revision);
      } catch (error) {
        if (revision === this.revision) status.setText(error instanceof Error ? error.message : 'Unable to prepare this module.');
      }
    };
    fileInput.addEventListener('change', () => { void prepare(); });
    typeSelect.addEventListener('change', () => { void prepare(); });
    const actions = root.createDiv({cls: 'vd-action-row'});
    textButton(actions, 'Close', () => this.close());
    textButton(actions, 'Advanced Bible inspection', () => { this.close(); new MySwordInspectModal(this.plugin).open(); }, 'vd-study-card-link');
  }

  private renderPreview(root: HTMLElement, preview: LocalImportPreview, status: HTMLElement,
    fileInput: HTMLInputElement, typeSelect: HTMLSelectElement, revision: number): void {
    root.createEl('h3', {text: preview.title});
    const facts = root.createDiv({cls: 'vd-import-meta'});
    const rows = [
      ['File', preview.fileName], ['Type', RESOURCE_LABELS[preview.kind]], ['Author', preview.author || 'Not supplied'],
      ['Abbreviation', preview.abbreviation || 'Not supplied'], ['Language', preview.language || 'Not supplied'],
      ['Version', preview.version || 'Not supplied'], ['Entries', preview.entryCount.toLocaleString()],
      ['Embedded images', String(preview.imageCount)], ['Selected file', formatStorageBytes(preview.selectedBytes)],
      ['Expanded database', formatStorageBytes(preview.databaseBytes)], ['Prepared library size', formatStorageBytes(preview.preparedBytes)],
      ['Destination', this.app.vault.getName() + ' · offline library']
    ];
    for (const [label, value] of rows) {
      const row = facts.createDiv(); row.createEl('strong', {text: label + ': '}); row.createSpan({text: value});
    }
    const hashes = root.createEl('details', {cls: 'vd-import-evidence'});
    hashes.createEl('summary', {text: 'File fingerprints'});
    hashes.createEl('p', {text: 'Selected-file SHA-256: ' + preview.sourceSha256});
    hashes.createEl('p', {text: 'Database SHA-256: ' + preview.databaseSha256});
    const notice = root.createEl('details', {cls: 'vd-resource-source-notice'});
    notice.createEl('summary', {text: 'Source notice and compatibility'});
    notice.createEl('p', {text: preview.notice || 'No source notice was supplied. Review the origin and permitted use of this file.'});
    notice.createEl('p', {text: 'Source numbering and original text are retained. Supported formatting, embedded images and internal links are available in the resource reader. Source CSS and scripts stay inert; unsupported markup remains accessible in Original source. This preview shows plain text.'});
    const samples = root.createEl('details'); samples.createEl('summary', {text: 'Sample content'});
    for (const sample of preview.samples) {
      samples.createEl('h4', {text: sample.title}); samples.createEl('p', {text: sample.text || 'No plain text in this entry.'});
    }
    const label = root.createEl('label', {text: 'Source or permission note (optional)'});
    const citation = label.createEl('textarea', {attr: {rows: '2', maxlength: '2000', 'aria-label': 'Local source or permission note'}});
    root.createEl('p', {cls: 'vd-subtle', text: 'Review where the file came from and any use conditions. Its basename, fingerprints and this note stay with the installed resource. The original file is unchanged.'});
    const actions = root.createDiv({cls: 'vd-action-row'});
    let restoreFocus=false;
    const install = textButton(actions, 'Install in this vault', () => {
      if (this.installing || revision !== this.revision) return;
      this.installing = true; install.disabled = true; fileInput.disabled = true; typeSelect.disabled = true; citation.disabled = true; cancel.hidden = false;
      status.setText('Saving and verifying the reviewed resource…');
      void this.plugin.modules.installLocalFile(preview.ticket, citation.value).then(info => {
        if (revision !== this.revision) return;
        install.hidden = true; cancel.hidden = true; citation.disabled = true;
        status.setText(info.title + ' is ready offline in this vault.');
        const open=textButton(actions, 'Open resource', () => { this.close(); void this.plugin.openResources(info.id); }, 'mod-cta');
        restoreActionFocus(open,restoreFocus);
        if (info.kind === 'bible') textButton(actions, 'Read this Bible', () => {
          this.close(); void this.plugin.setBibleEdition(info.id).then(() => {
            if (this.plugin.settings.bibleEdition === info.id) return this.plugin.openReader();
          });
        });
      }).catch(error => {
        if (revision === this.revision) {
          status.setText(error instanceof Error ? error.message : 'Local import failed.');
          install.disabled = false; citation.disabled = false; cancel.hidden = true;restoreActionFocus(install,restoreFocus);
        }
      }).finally(() => {
        if (revision === this.revision) { this.installing = false; fileInput.disabled = false; typeSelect.disabled = false; }
      });
    }, 'mod-cta');
    install.addEventListener('click',event=>{restoreFocus=requestsFocusRestoration(event);});
    const cancel = textButton(actions, 'Cancel import', () => this.plugin.modules.cancel(preview.id)); cancel.hidden = true;
  }

  onClose(): void {
    this.revision++; this.previewAbort?.abort(); this.previewAbort = null;
    if (this.preview) {
      if (this.installing) this.plugin.modules.cancel(this.preview.id);
      this.plugin.modules.discardLocalPreview(this.preview.ticket);
    }
    this.preview = null; this.contentEl.empty();
  }
}
