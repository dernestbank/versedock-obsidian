import { Modal, Notice } from 'obsidian';
import type { SwordDockController } from '../controller';
import { DiscoveryIndex } from '../core/discovery-index';
import {
  COLLECTIONS,
  artifactName,
  entryKey,
  pinnedSource,
  type DiscoveryEntry,
} from '../core/discovery-sources';
import { moduleMembers } from '../core/discovery-archive';
import { MAX_READING_BYTES, checkCancelled } from '../core/reading-modules';
import { sha256 } from '../core/module-installation';
import { RESOURCE_LABELS, RESOURCE_TYPES } from '../core/resource-dock';
import { catalogueCache } from '../obsidian/discovery-cache';
import { readPublisher } from '../obsidian/discovery-network';
import { textButton } from './components';

const prettySize = (n?: number) =>
  n ? (n < 1048576 ? Math.ceil(n / 1024) + ' KiB' : (n / 1048576).toFixed(1) + ' MiB') : 'Size unknown';
const explain = (e: unknown) => (e instanceof Error ? e.message : 'Publisher unavailable.');
interface RowJob {
  entry: DiscoveryEntry;
  state: 'queued' | 'active' | 'ready' | 'failed' | 'cancelled';
  status: string;
  controller: AbortController;
  ids: string[];
}
class ArchiveChoice extends Modal {
  private chosen = new Set<string>();
  private done = false;
  constructor(
    private plugin: SwordDockController,
    private names: string[],
    private resolve: (names: string[]) => void,
  ) {
    super(plugin.app);
  }
  onOpen() {
    this.setTitle('Choose modules from this ZIP');
    for (const name of this.names) {
      const row = this.contentEl.createEl('label', { cls: 'vd-discovery-check' });
      const box = row.createEl('input', { attr: { type: 'checkbox' } });
      row.createSpan({ text: name });
      box.onchange = () => {
        if (box.checked) this.chosen.add(name);
        else this.chosen.delete(name);
        install.disabled = !this.chosen.size;
      };
    }
    const install = textButton(
      this.contentEl,
      'Install chosen modules',
      () => {
        this.done = true;
        this.resolve([...this.chosen]);
        this.close();
      },
      'mod-cta',
    );
    install.disabled = true;
  }
  onClose() {
    if (!this.done) this.resolve([]);
  }
}
export class DiscoveryWizard extends Modal {
  private readonly index: DiscoveryIndex;
  private readonly life = new AbortController();
  private selected = new Map<string, DiscoveryEntry>();
  private jobs: RowJob[] = [];
  private queue = Promise.resolve();
  private stage: 'browse' | 'review' | 'install' = 'browse';
  private source = '';
  private kind = '';
  private language = '';
  private query = '';
  private all = false;
  private limit = 40;
  private sourceSummary!: HTMLElement;
  private results!: HTMLElement;
  private sources!: HTMLElement;
  private reviewButton!: HTMLButtonElement;
  private jobList!: HTMLElement;
  constructor(private plugin: SwordDockController, kind: typeof RESOURCE_TYPES[number] | "" = "") {
    super(plugin.app);
    this.kind = kind;
    this.index = new DiscoveryIndex(
      catalogueCache(plugin.app),
      async (c, url) =>
        new TextDecoder().decode(await readPublisher(c, url, 4 * 1024 * 1024, this.life.signal)),
    );
  }
  onOpen() {
    this.modalEl.addClass('vd-discovery-modal');
    this.setTitle('Discover modules');
    this.browse();
    void this.refresh(false);
  }
  onClose() {
    this.life.abort();
    for (const j of this.jobs) this.cancel(j);
    this.contentEl.empty();
  }
  private async refresh(force: boolean) {
    const list = [...COLLECTIONS];
    const worker = async () => {
      while (list.length && !this.life.signal.aborted) {
        await this.index.refresh(list.shift()!, force ? 'refresh' : 'auto');
        this.updated();
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }
  private updated() {
    if (!this.life.signal.aborted && this.stage === 'browse') {
      this.renderSources();
      this.renderResults();
    }
  }
  private browse() {
    this.stage = 'browse';
    const root = this.contentEl;
    root.empty();
    const filters = root.createDiv({ cls: 'vd-catalogue-filters' });
    const search = filters.createEl('input', {
      attr: { type: 'search', placeholder: 'Search title or author', 'aria-label': 'Search title or author' },
    });
    search.value = this.query;
    search.oninput = () => {
      this.query = search.value;
      this.limit = 40;
      this.renderResults();
    };
    const select = (
      label: string,
      values: [string, string][],
      current: string,
      change: (v: string) => void,
    ) => {
      const el = filters.createEl('select', { attr: { 'aria-label': label } });
      el.createEl('option', { value: '', text: label });
      for (const [value, text] of values) el.createEl('option', { value, text });
      el.value = current;
      el.onchange = () => {
        change(el.value);
        this.limit = 40;
        this.renderResults();
      };
    };
    select(
      'All publishers',
      [...new Set(COLLECTIONS.map((c) => c.publisher))].map((s) => [s, s]),
      this.source,
      (v) => (this.source = v),
    );
    select(
      'All resource types',
      RESOURCE_TYPES.map((k) => [k, RESOURCE_LABELS[k]]),
      this.kind,
      (v) => (this.kind = v),
    );
    const lang = filters.createEl('input', {
      attr: { type: 'search', placeholder: 'Language', 'aria-label': 'Filter by language' },
    });
    lang.value = this.language;
    lang.oninput = () => {
      this.language = lang.value;
      this.limit = 40;
      this.renderResults();
    };
    const label = filters.createEl('label', { cls: 'vd-discovery-check' });
    const box = label.createEl('input', { attr: { type: 'checkbox' } });
    label.createSpan({ text: 'Show unavailable' });
    box.checked = this.all;
    box.onchange = () => {
      this.all = box.checked;
      this.renderResults();
    };
    const details = root.createEl('details');
    this.sourceSummary = details.createEl('summary', { text: 'Publisher sources' });
    textButton(details, 'Refresh now', () => void this.refresh(true));
    this.sources = details.createDiv();
    this.renderSources();
    this.reviewButton = textButton(root, 'Review selected', () => this.review(), 'mod-cta');
    this.results = root.createDiv();
    this.renderResults();
  }
  private renderSources() {
    this.sources.empty();
    this.sourceSummary.setText(
      'Publisher sources' +
        (this.index.errors.size ? ' · ' + this.index.errors.size + ' need attention' : ''),
    );
    for (const c of COLLECTIONS) {
      const s = this.index.snapshots.get(c.key),
        error = this.index.errors.get(c.key),
        row = this.sources.createDiv({ cls: 'vd-discovery-source' });
      row.createSpan({
        text:
          c.publisher +
          ' · ' +
          c.key +
          ' · ' +
          (s ? 'Last refreshed ' + new Date(s.time).toLocaleString() : 'No cached catalogue') +
          (error ? ' · ' + error : ''),
      });
      if (s?.next)
        textButton(row, 'Load next page', async () => {
          await this.index.refresh(c, 'next');
          this.updated();
        });
    }
  }
  private installed(e: DiscoveryEntry) {
    const pin = e.url && pinnedSource(e.url);
    return this.plugin.modules.installed.filter(
      (m) => m.id === (pin && pin.id) || (!!e.url && m.publisherUrl === e.url),
    );
  }
  private openModule(id: string) {
    const m = this.plugin.modules.installed.find((m) => m.id === id);
    if (!m) return;
    this.close();
    if (m.kind === 'bible') void this.plugin.setBibleEdition(id).then(() => this.plugin.openReader());
    else void this.plugin.openResources(id);
  }
  private updateReview() {
    this.reviewButton.disabled = !this.selected.size;
    this.reviewButton.setText('Review selected (' + this.selected.size + ')');
  }
  private renderResults() {
    this.results.empty();
    this.updateReview();
    const q = this.query.trim().toLowerCase();
    const entries = this.index.entries().filter((e) => {
      const c = COLLECTIONS.find((c) => c.key === e.collection)!;
      return (
        (this.all || (!!e.url && !e.reason)) &&
        (!this.source || this.source === c.publisher) &&
        (!this.kind || e.kind === this.kind) &&
        e.language.toLowerCase().includes(this.language.trim().toLowerCase()) &&
        (e.title + ' ' + e.author).toLowerCase().includes(q)
      );
    });
    this.results.createEl('p', {
      cls: 'vd-subtle',
      attr: { role: 'status' },
      text: entries.length + ' matching modules',
    });
    for (const e of entries.slice(0, this.limit)) {
      const row = this.results.createDiv({ cls: 'vd-discovery-row' }),
        label = row.createEl('label', { cls: 'vd-discovery-check' });
      const box = label.createEl('input', { attr: { type: 'checkbox', 'aria-label': 'Select ' + e.title } });
      box.disabled = !e.url || !!e.reason;
      box.checked = this.selected.has(entryKey(e));
      box.onchange = () => {
        if (box.checked) this.selected.set(entryKey(e), e);
        else this.selected.delete(entryKey(e));
        this.updateReview();
      };
      label.createEl('strong', { text: e.title });
      const c = COLLECTIONS.find((c) => c.key === e.collection)!;
      row.createDiv({
        cls: 'vd-subtle',
        text: [
          c.publisher,
          e.kind && RESOURCE_LABELS[e.kind],
          e.author,
          e.language,
          e.url && prettySize(e.size),
        ]
          .filter(Boolean)
          .join(' · '),
      });
      if (e.reason) row.createDiv({ cls: 'vd-subtle', text: e.reason });
      if (c.format === 'wordpress' && !e.url)
        textButton(row, 'Check download', async () => {
          try {
            await this.index.resolve(e);
            this.updated();
          } catch (err) {
            new Notice(explain(err));
          }
        });
      for (const m of this.installed(e)) textButton(row, 'Open ' + m.title, () => this.openModule(m.id));
    }
    if (entries.length > this.limit)
      textButton(this.results, 'Show more modules', () => {
        this.limit += 40;
        this.renderResults();
      });
  }
  private review() {
    this.stage = 'review';
    const root = this.contentEl;
    root.empty();
    root.createEl('h3', { text: 'Review downloads' });
    root.createEl('p', {
      text: 'The selected publishers will receive a download request. SwordDock checks each file and stores supported modules in this vault.',
    });
    for (const e of this.selected.values()) {
      const c = COLLECTIONS.find((c) => c.key === e.collection)!;
      const row = root.createDiv({ cls: 'vd-discovery-row' });
      row.createEl('strong', { text: e.title });
      row.createDiv({ text: c.publisher + ' · ' + prettySize(e.size) + ' · ' + artifactName(e.url!) });
      row.createEl('a', {
        text: 'Publisher page',
        attr: { href: e.page, target: '_blank', rel: 'noreferrer' },
      });
    }
    textButton(root, 'Back', () => this.browse());
    textButton(root, 'Install selected', () => this.start(), 'mod-cta');
  }
  private start() {
    this.stage = 'install';
    this.contentEl.empty();
    this.contentEl.createEl('h3', { text: 'Downloads' });
    this.contentEl.createEl('p', {
      cls: 'vd-subtle',
      text: 'Keep this window open until your downloads finish. Closing it cancels remaining work.',
    });
    this.jobList = this.contentEl.createDiv();
    this.jobs = [...this.selected.values()].map((entry) => ({
      entry,
      state: 'queued',
      status: 'Queued',
      controller: new AbortController(),
      ids: [],
    }));
    for (const j of this.jobs) this.enqueue(j);
    this.renderJobs();
  }
  private enqueue(j: RowJob) {
    j.controller = new AbortController();
    j.state = 'queued';
    j.status = 'Queued';
    const attempt = j.controller.signal;
    this.queue = this.queue.then(() => this.run(j, attempt));
  }
  private cancel(j: RowJob) {
    if (j.state !== 'queued' && j.state !== 'active') return;
    j.controller.abort();
    const pin = j.entry.url && pinnedSource(j.entry.url);
    if (pin && j.state === 'active') this.plugin.modules.cancel(pin.id);
    j.status = 'Cancelled';
    j.state = 'cancelled';
  }
  private async run(j: RowJob, signal: AbortSignal) {
    const e = j.entry;
    if (signal.aborted || this.life.signal.aborted) return;
    const url = e.url!,
      c = COLLECTIONS.find((c) => c.key === e.collection)!;
    let unsubscribe = () => {};
    try {
      j.state = 'active';
      j.status = 'Downloading…';
      this.renderJobs();
      const pin = pinnedSource(url);
      if (pin) {
        unsubscribe = this.plugin.modules.subscribe(() => {
          const job = this.plugin.modules.jobs.get(pin.id);
          if (job) {
            j.status = job.status + ' · ' + prettySize(job.received);
            this.updateStatus(j);
          }
        });
        await this.plugin.modules.install(pin.id);
        checkCancelled(signal);
        const job = this.plugin.modules.jobs.get(pin.id);
        if (job?.status !== 'ready') throw Error(job?.error ?? 'Install failed.');
        j.ids = [pin.id];
      } else {
        let last = 0;
        const bytes = await readPublisher(c, url, MAX_READING_BYTES, signal, (n) => {
          if (performance.now() - last > 150) {
            last = performance.now();
            j.status = 'Downloading · ' + prettySize(n);
            this.updateStatus(j);
          }
        });
        checkCancelled(signal);
        j.status = 'Checking download…';
        this.updateStatus(j);
        const digest = await sha256(bytes);
        if (e.hash && digest !== e.hash) throw Error('Publisher checksum failed.');
        const members = moduleMembers(bytes, artifactName(url));
        let chosen = members;
        if (members.length > 1) {
          const names = await new Promise<string[]>((resolve) => {
            const modal = new ArchiveChoice(
              this.plugin,
              members.map((m) => m.name),
              (names) => {
                signal.removeEventListener('abort', abort);
                resolve(names);
              },
            );
            const abort = () => modal.close();
            if (signal.aborted) {
              resolve([]);
              return;
            }
            signal.addEventListener('abort', abort, { once: true });
            modal.open();
          });
          if (!names.length) {
            this.cancel(j);
            return;
          }
          chosen = members.filter((m) => names.includes(m.name));
        }
        for (const m of chosen) {
          checkCancelled(signal);
          j.status = 'Preparing ' + m.name;
          this.updateStatus(j);
          const info = await this.plugin.modules.installPublisherMember(
            e,
            { name: m.name, bytes: await m.unpack(signal) },
            m.name,
            digest,
            signal,
          );
          if (!j.ids.includes(info.id)) j.ids.push(info.id);
        }
      }
      j.state = 'ready';
      j.status = 'Ready offline';
    } catch (err) {
      if (j.controller.signal !== signal) return;
      j.state = signal.aborted ? 'cancelled' : 'failed';
      j.status = signal.aborted ? 'Cancelled' : explain(err);
    } finally {
      unsubscribe();
      if (!this.life.signal.aborted) this.renderJobs();
    }
  }
  private statuses = new Map<RowJob, HTMLElement>();
  private updateStatus(j: RowJob) {
    this.statuses.get(j)?.setText(j.status);
  }
  private renderJobs() {
    if (this.life.signal.aborted) return;
    this.jobList.empty();
    this.statuses.clear();
    for (const j of this.jobs) {
      const row = this.jobList.createDiv({ cls: 'vd-discovery-row' });
      row.createEl('strong', { text: j.entry.title });
      this.statuses.set(j, row.createDiv({ attr: { role: 'status' }, text: j.status }));
      if (j.state === 'queued' || j.state === 'active')
        textButton(row, 'Cancel', () => {
          this.cancel(j);
          this.renderJobs();
        });
      if (j.state === 'failed' || j.state === 'cancelled')
        textButton(row, 'Retry', () => {
          this.enqueue(j);
          this.renderJobs();
        });
      if (this.jobs.every((job) => job.state !== 'active' && job.state !== 'queued'))
        for (const id of j.ids) {
          const m = this.plugin.modules.installed.find((m) => m.id === id);
          if (m) textButton(row, 'Open ' + m.title, () => this.openModule(id));
        }
    }
    if (this.jobs.every((j) => j.state !== 'active' && j.state !== 'queued'))
      textButton(this.jobList, 'Back to discovery', () => {
        this.selected.clear();
        this.browse();
      });
  }
}
