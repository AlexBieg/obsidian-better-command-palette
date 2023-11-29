import { DataAdapter, Plugin } from 'obsidian';

import SuggestionsWorker from 'web-worker:./web-workers/suggestions-worker';
import { OrderedSet, MacroCommand, PaletteMatch } from 'src/utils';
import BetterCommandPaletteModal from 'src/palette';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { BetterCommandPalettePluginSettings, BetterCommandPaletteSettingTab, DEFAULT_SETTINGS } from 'src/settings';
import { MACRO_COMMAND_ID_PREFIX } from './utils/constants';
import './styles.scss';

const SEARCH_HISTORY_PATH = '.obsidian/plugins/obsidian-better-command-palette/searchHistory.json';
export default class BetterCommandPalettePlugin extends Plugin {
    app: UnsafeAppInterface;

    settings: BetterCommandPalettePluginSettings;

    prevCommands: OrderedSet<Match>;

    prevTags: OrderedSet<Match>;

    suggestionsWorker: Worker;

    fs: DataAdapter;

    async onload() {
        // eslint-disable-next-line no-console
        console.log('Loading plugin: Better Command Palette');

        this.fs = this.app.vault.adapter;
        await this.loadSettings();
        await this.loadSearchHistory();
        this.registerEvent(this.app.workspace.on('quit', this.saveSearchHistory, this));

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
        // this.saveSearchHistory();  // doesn't work
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

            if (this.prevCommands) {
                this.prevCommands = this.prevCommands.values().reduce((acc, match) => {
                    if (match.id === macro.id && match.text !== macro.name) return acc;

                    acc.add(match);

                    return acc;
                }, new OrderedSet<Match>());
            }
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

    async loadSearchHistory() {
        console.log(SEARCH_HISTORY_PATH);
         
        try {
            const historyData = JSON.parse(await this.fs.read(SEARCH_HISTORY_PATH));
            const createPaletteMatch = (item: Match) => new PaletteMatch(item.id, item.text, item.tags);

            this.prevCommands = new OrderedSet(
                (historyData.prevCommands || []).map(createPaletteMatch)
            );
            this.prevTags = new OrderedSet(
                (historyData.prevTags || []).map(createPaletteMatch)
            );
        } catch (error) {
            console.error('Error loading search history:', error);
            this.prevCommands = new OrderedSet<Match>();
            this.prevTags = new OrderedSet<Match>();
        }
    }

    saveSearchHistory() {
        // limit the number of stored commands and tags to prevent storing excessively long search histories
        const maxCount = 15;
        const limitedPrevCommands = this.prevCommands.values().slice(0, maxCount);
        const limitedPrevTags = this.prevTags.values().slice(0, maxCount);

        const historyData = JSON.stringify({
            prevCommands: limitedPrevCommands,
            prevTags: limitedPrevTags
        });

        this.fs.write(SEARCH_HISTORY_PATH, historyData);
    }
}
