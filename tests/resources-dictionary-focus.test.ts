import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceLeaf } from 'obsidian';
import type { SwordDockController } from '../src/controller';
import { parseReference } from '../src/core/references';
import { ResourcesView } from '../src/ui/resources-view';
import { fixtureApp, FixtureElement } from './ui-fixture';

vi.mock('obsidian', () => ({
  Modal: class {}, ItemView: class {}, FuzzySuggestModal: class {}, MarkdownView: class {},
  TFile: class {}, Menu: class {}, Notice: vi.fn(), setIcon: vi.fn()
}));

// An input belongs to the constructor of the window that created its document.
function vaultWindow() {
  const app = fixtureApp();
  class WindowInput {
    static [Symbol.hasInstance](element: unknown): boolean {
      return element instanceof FixtureElement && element.tag === 'input' && element.ownerDocument === app.qaDoc;
    }
  }
  app.qaDoc.defaultView = { HTMLInputElement: WindowInput };
  return app;
}

function dictionaryWorkspace(popout = false) {
  const main = vaultWindow();
  const app = popout ? vaultWindow() : main;
  vi.stubGlobal('document', main.qaDoc);
  vi.stubGlobal('HTMLInputElement', main.qaDoc.defaultView.HTMLInputElement);
  const listeners = new Set<() => void>();
  const plugin = {
    currentRef: parseReference('John 3:16'),
    library: {}, kjv: {}, commentary: {}, lexicon: { metadata: {}, lookup: async () => null },
    modules: { installed: [], subscribe: () => () => {} },
    subscribe(callback: () => void) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }
  };

  async function openDictionary() {
    const root = app.qaRoot.createDiv();
    const view = new ResourcesView({} as WorkspaceLeaf, plugin as unknown as SwordDockController);
    Object.assign(view, { app, contentEl: root });
    await view.onOpen();
    const chooser = root.querySelector('.vd-resource-type-select')!;
    chooser.value = 'dictionary';
    chooser.dispatch('change');
    return { view, query: () => root.querySelector('.vd-resource-dictionary-query')! };
  }

  function followReader() {
    plugin.currentRef = parseReference('John 3:17');
    for (const refresh of listeners) refresh();
  }
  return { app, openDictionary, followReader };
}

function edit(input: FixtureElement) {
  input.focus();
  input.value = 'G1234';
  input.dispatch('input');
  input.setSelectionRange(1, 4, 'backward');
}

afterEach(() => vi.unstubAllGlobals());

describe('Strong’s dictionary editing during linked Reader navigation', () => {
  it('keeps focus in the edited Resources pane when a sibling dictionary also follows the Reader', async () => {
    const workspace = dictionaryWorkspace();
    const first = await workspace.openDictionary();
    const sibling = await workspace.openDictionary();
    edit(first.query());

    workspace.followReader();

    expect(workspace.app.qaDoc.activeElement === first.query()).toBe(true);
    await sibling.view.onClose();
    await first.view.onClose();
  });

  it.each([
    { window: 'main window', popout: false },
    { window: 'pop-out window', popout: true }
  ])('preserves the focused query and its backward selection in the $window', async ({ popout }) => {
    const workspace = dictionaryWorkspace(popout);
    const dock = await workspace.openDictionary();
    edit(dock.query());

    workspace.followReader();

    const input = dock.query();
    expect({
      editing: workspace.app.qaDoc.activeElement === input,
      value: input.value,
      selection: [input.selectionStart, input.selectionEnd, input.selectionDirection]
    }).toEqual({ editing: true, value: 'G1234', selection: [1, 4, 'backward'] });
    await dock.view.onClose();
  });
});
