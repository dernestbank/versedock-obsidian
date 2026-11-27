import type { SwordDockController } from '../controller';
import {Notice} from 'obsidian';
import { commentarySectionsForPassage, dictionaryHeadwords } from '../core/installed-study';
import { modulePlainText, type ReadingEntry, type ReadingModule } from '../core/reading-modules';
import { refLabel, type PassageReference } from '../core/references';
import { textButton } from './components';
import { renderModuleSource } from './module-source';
import {renderResourceEntryContent} from './resource-content';
import {ResourceEntryIndex,type ResourceLink} from '../core/resource-links';
import {ResourcePassageModal} from './resource-passage-modal';
import {ResourceEntryModal,ResourceNoteModal} from './resource-entry-modal';

/** Installed source content never falls through to a bundled commentary or lexicon. */
export class InstalledStudyPanel {
  private disposed = false;
  private rightToLeft = false;
  private module:ReadingModule|null=null;
  private index:ResourceEntryIndex|null=null;
  private chooseDictionary:((entry:ReadingEntry)=>void)|null=null;
  private activeEntry:ReadingEntry|null=null;
  private dictionaryHistory:ReadingEntry[]=[];
  private back:HTMLButtonElement|null=null;
  constructor(private readonly root: HTMLElement, private readonly plugin: SwordDockController,
    private readonly id: string, private readonly ref: PassageReference,
    private query: string, private entryKey: string,
    private readonly save: (query: string, entry: string) => void) { void this.load(); }

  dispose(): void { this.disposed = true; }

  private async load(): Promise<void> {
    this.root.setText('Opening offline resource…');
    try {
      const module = await this.plugin.modules.load(this.id);
      if (this.disposed || !this.root.isConnected) return;
      this.root.empty();
      this.module=module;this.index=new ResourceEntryIndex(module);
      this.rightToLeft=!!module.metadata?.rightToLeft;
      this.root.createEl('h3', {text: module.title});
      this.root.createEl('p', {cls: 'vd-subtle', text: [module.author, module.version, 'Offline'].filter(Boolean).join(' · ')});
      if (module.kind === 'commentary') this.commentary(module);
      else if (module.kind === 'dictionary') this.dictionary(module);
      else throw new Error('This resource is not a commentary or dictionary.');
      const notice = this.root.createEl('details', {cls: 'vd-resource-source-notice'});
      notice.createEl('summary', {text: 'Source and attribution'});
      renderModuleSource(notice,module);
    } catch (error) {
      if (!this.disposed && this.root.isConnected)
        this.root.setText(error instanceof Error ? error.message : 'Unable to open this resource.');
    }
  }

  private renderEntry(parent: HTMLElement, entry: ReadingEntry): void {
    const article = parent.createEl('article', {cls: 'vd-installed-study-entry'});
    article.setAttribute('dir',this.rightToLeft?'rtl':'ltr');
    article.createEl('h4', {text: entry.title,attr:{tabindex:'-1'}});
    textButton(article, "Cite entry", () => this.plugin.citeResource(this.module!.title + " · " + entry.title,
      {module:this.id, entry:entry.key, source:this.module!.sourceSha256}), "vd-study-card-link");
    renderResourceEntryContent(article,this.module!,entry,{open:target=>this.openLink(target)},this.plugin);
    textButton(article, 'Copy entry', () => {
      void navigator.clipboard.writeText(entry.title + '\n\n' + modulePlainText(entry));
    }, 'vd-study-card-link');
  }
  private openLink(target:ResourceLink):void{
    if(this.disposed||!this.module)return;
    if(target.kind==='scripture'){new ResourcePassageModal(this.plugin,target,this.module.title).open();return;}
    if(target.kind==='entry'||target.kind==='commentary'){
      const result=this.index!.resolve(target);if(!result.entries.length){new Notice(result.reason??'Linked entry unavailable.');return;}
      if(this.module.kind==='dictionary'&&target.kind==='entry'){
        if(this.activeEntry)this.dictionaryHistory=[...this.dictionaryHistory.slice(-49),this.activeEntry];
        this.chooseDictionary?.(result.entries[0]);if(this.back)this.back.disabled=!this.dictionaryHistory.length;
        this.root.querySelector<HTMLElement>('.vd-dictionary-entry h4')?.focus({preventScroll:true});
      }else new ResourceEntryModal(this.plugin,this.module,result.entries).open();
    }else if(target.kind==='note')new ResourceNoteModal(this.plugin,target.text).open();
    else if(target.kind==='anchor')new Notice('The source anchor is missing or ambiguous.');
  }

  private commentary(module: ReadingModule): void {
    this.root.createEl('p', {cls: 'vd-subtle', text: refLabel(this.ref) + ' · source ranges and introductions'});
    const {passage, introductions} = commentarySectionsForPassage(module.entries, this.ref);
    const entries = [...passage, ...introductions];
    const content = this.root.createDiv();
    const controls = this.root.createDiv({cls: 'vd-action-row'});
    let page = 0;
    const status = controls.createSpan({attr: {role: 'status'}});
    const previous = textButton(controls, 'Previous', () => { page--; render(); });
    const next = textButton(controls, 'Next', () => { page++; render(); });
    const render = (): void => {
      content.empty();
      if (!passage.length) content.createEl('p', {cls: 'vd-subtle', text: introductions.length
        ? 'This source has no passage-specific note here. Its introductions are available below.'
        : 'This source has no commentary for the selected passage.'});
      for (const entry of entries.slice(page * 8, page * 8 + 8)) {
        if (entry.reference?.chapter === 0 || entry.reference?.verse === 0) {
          const context = content.createEl('details', {cls: 'vd-commentary-introduction'});
          context.createEl('summary', {text: entry.reference.chapter === 0 ? 'Book introduction' : 'Chapter introduction'});
          this.renderEntry(context, entry);
        } else this.renderEntry(content, entry);
      }
      status.setText(entries.length ? (page * 8 + 1) + '–' + Math.min(entries.length, page * 8 + 8) + ' of ' + entries.length : '0 entries');
      previous.disabled = page === 0; next.disabled = (page + 1) * 8 >= entries.length;
    };
    render();
  }

  private dictionary(module: ReadingModule): void {
    const form = this.root.createEl('form', {cls: 'vd-resource-dictionary-search'});
    const label = form.createEl('label', {text: 'Find a headword'});
    const input = label.createEl('input', {cls: 'vd-resource-dictionary-query', attr: {
      type: 'search', maxlength: '100', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Search ' + module.title + ' headwords'
    }});
    input.value = this.query;
    const choices = this.root.createDiv({cls: 'vd-dictionary-headwords'});
    const controls = this.root.createDiv({cls: 'vd-action-row'});
    const status = controls.createSpan({attr: {role: 'status', 'aria-live': 'polite'}});
    let offset = 0;
    const previous = textButton(controls, 'Previous', () => { offset = Math.max(0, offset - 25); results(); });
    const next = textButton(controls, 'Next', () => { offset += 25; results(); });
    const content = this.root.createDiv({cls: 'vd-dictionary-entry'});
    this.back=textButton(controls,'Back',()=>{const entry=this.dictionaryHistory.pop();if(entry){choose(entry);this.back!.disabled=!this.dictionaryHistory.length;(content.querySelector<HTMLElement>('h4')??content).focus({preventScroll:true});}});this.back.disabled=true;
    content.tabIndex=0;
    const choose = (entry: ReadingEntry): void => {
      this.activeEntry=entry;
      this.entryKey = entry.key; this.save(this.query, this.entryKey);
      content.empty(); this.renderEntry(content, entry);
      for (const button of choices.querySelectorAll<HTMLButtonElement>('button'))
        button.setAttribute('aria-pressed', String(button.dataset.entry === entry.key));
    };
    this.chooseDictionary=choose;
    const results = (): void => {
      const found = dictionaryHeadwords(module.entries, input.value, offset);
      choices.empty();
      for (const entry of found.entries) {
        const button = textButton(choices, entry.title, () => choose(entry), 'vd-study-card-link');
        button.dataset.entry = entry.key; button.setAttribute('aria-pressed', String(entry.key === this.entryKey));
      }
      if (!found.total) choices.setText('No matching headwords in this dictionary.');
      status.setText(found.total ? (offset + 1) + '–' + Math.min(offset + 25, found.total) + ' of ' + found.total : '0 matches');
      previous.disabled = offset === 0; next.disabled = offset + 25 >= found.total;
    };
    const search = (): void => {
      this.query = input.value.slice(0, 100); offset = 0; this.save(this.query, this.entryKey); results();
    };
    form.addEventListener('submit', event => { event.preventDefault(); search(); });
    input.addEventListener('input', search);
    results();
    const selected = module.entries.find(entry => entry.key === this.entryKey);
    if (selected) choose(selected);
    else content.createEl('p', {cls: 'vd-subtle', text: 'Choose a headword to read its full entry.'});
  }
}
