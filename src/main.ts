import { Plugin } from 'obsidian';

import SuggestionsWorker from 'web-worker:./web-workers/suggestions-worker';
import { OrderedSet, MacroCommand } from 'src/utils';
import BetterCommandPaletteModal from 'src/palette';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { BetterCommandPalettePluginSettings, BetterCommandPaletteSettingTab, DEFAULT_SETTINGS } from 'src/settings';
import { MACRO_COMMAND_ID_PREFIX } from './utils/constants';
import './styles.scss';

export default class BetterCommandPalettePlugin extends Plugin {
    app: UnsafeAppInterface;

    settings: BetterCommandPalettePluginSettings;

    prevCommands: OrderedSet<Match>;

    prevTags: OrderedSet<Match>;

    suggestionsWorker: Worker;

    async onload() {
        // eslint-disable-next-line no-console
        console.log('Loading plugin: Better Command Palette');

        await this.loadSettings();

        this.prevCommands = new OrderedSet<Match>();
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

    loadMacroCommands() {
        this.settings.macros.forEach((macroData, index) => {
            if (!macroData.name || !macroData.commandIds.length) {
                return;
            }

            const macro = new MacroCommand(
                this.app,
                `${MACRO_COMMAND_ID_PREFIX}${index}`,
                macroData.name,
                macroData.commandIds,
                macroData.delay,
            );

            this.addCommand(macro);
        });
    }

    deleteMacroCommands() {
        const macroCommandIds = Object.keys(this.app.commands.commands)
            .filter((id) => id.includes(MACRO_COMMAND_ID_PREFIX));

        macroCommandIds.forEach((id) => {
            this.app.commands.removeCommand(id);
        });
    }

    async loadSettings() {
        this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
        this.loadMacroCommands();
    }

    async saveSettings() {
        this.deleteMacroCommands();
        await this.saveData(this.settings);
        this.loadMacroCommands();
    }
}
