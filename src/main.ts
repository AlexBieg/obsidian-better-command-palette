import { Plugin } from 'obsidian';

import SuggestionsWorker from 'web-worker:./web-workers/suggestions-worker';
import { OrderedSet } from 'src/utils';
import BetterCommandPaletteModal from 'src/palette';
import { Match } from 'src/types/types';
import { BetterCommandPalettePluginSettings, BetterCommandPaletteSettingTab, DEFAULT_SETTINGS } from 'src/settings';

export default class BetterCommandPalettePlugin extends Plugin {
    settings: BetterCommandPalettePluginSettings;

    prevCommands: OrderedSet<Match>;

    prevFiles: OrderedSet<Match>;

    prevTags: OrderedSet<Match>;

    suggestionsWorker: Worker;

    async onload() {
        // eslint-disable-next-line
        console.log('Loading plugin: Better Command Palette');

        await this.loadSettings();

        this.prevCommands = new OrderedSet<Match>();
        this.prevFiles = new OrderedSet<Match>();
        this.prevTags = new OrderedSet<Match>();
        this.suggestionsWorker = new SuggestionsWorker({});

        this.addCommand({
            id: 'open-better-commmand-palette',
            name: 'Open better command palette',
            // Generally I would not set a hotkey, but since it is a
            // command palette I think it makes sense
            // Can still be overwritten in the hotkey settings
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'p' }],
            callback: () => {
                new BetterCommandPaletteModal(
                    this.app,
                    this.prevCommands,
                    this.prevFiles,
                    this.prevTags,
                    this,
                    this.suggestionsWorker,
                ).open();
            },
        });

        this.addCommand({
            id: 'open-better-commmand-palette-file-search',
            name: 'Open better command palette: File Search',
            hotkeys: [],
            callback: () => {
                new BetterCommandPaletteModal(
                    this.app,
                    this.prevCommands,
                    this.prevFiles,
                    this.prevTags,
                    this,
                    this.suggestionsWorker,
                    this.settings.fileSearchPrefix,
                ).open();
            },
        });

        this.addCommand({
            id: 'open-better-commmand-palette-tag-search',
            name: 'Open better command palette: Tag Search',
            hotkeys: [],
            callback: () => {
                new BetterCommandPaletteModal(
                    this.app,
                    this.prevCommands,
                    this.prevFiles,
                    this.prevTags,
                    this,
                    this.suggestionsWorker,
                    this.settings.tagSearchPrefix,
                ).open();
            },
        });

        this.addSettingTab(new BetterCommandPaletteSettingTab(this.app, this));
    }

    onunload(): void {
        this.suggestionsWorker.terminate();
    }

    async loadSettings() {
        this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
