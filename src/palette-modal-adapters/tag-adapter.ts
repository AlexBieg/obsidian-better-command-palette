import { Instruction } from 'obsidian';
import {
    generateHotKeyText,
    PaletteMatch, SuggestModalAdapter,
}
    from 'src/utils';
import { ActionType, QUERY_TAG } from 'src/utils/constants';
import { Match, UnsafeAppInterface } from '../types/types';

export default class BetterCommandPaletteTagAdapter extends SuggestModalAdapter {
    titleText!: string;

    emptyStateText!: string;

    // Unsafe interface
    declare app: UnsafeAppInterface;

    allItems!: Match[];

    tagSearchPrefix!: string;

    initialize(): void {
        super.initialize();

        this.hiddenIds = this.plugin.settings.hiddenTags;
        this.hiddenIdsSettingsKey = 'hiddenTags';

        this.tagSearchPrefix = this.plugin.settings.tagSearchPrefix;
        this.titleText = 'Better Command Palette: Tags';
        this.emptyStateText = 'No matching tags.';

        this.allItems = Object.entries(this.app.metadataCache.getTags())
            .map(([tag, count]) => new PaletteMatch(tag, tag, [count]));
    }

    mount(): void {
        this.keymapHandlers = [
            this.palette.scope.register(['Mod'], this.plugin.settings.commandSearchHotkey, () => this.palette.changeActionType(ActionType.Commands)),
            this.palette.scope.register(['Mod'], this.plugin.settings.fileSearchHotkey, () => this.palette.changeActionType(ActionType.Files)),
        ];
    }

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'See file usage' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: this.plugin.settings.commandSearchHotkey }, this.plugin.settings), purpose: 'Search Commands' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: this.plugin.settings.fileSearchHotkey }, this.plugin.settings), purpose: 'Search Files' },
        ];
    }

    cleanQuery(query: string): string {
        return query.replace(this.tagSearchPrefix, '');
    }

    renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void {
        content.createEl('span', {
            cls: 'suggestion-content',
            text: match.text,
        });

        const count = parseInt(match.tags[0], 10);

        aux.createEl('span', {
            cls: 'suggestion-flair',
            text: `Found in ${count} file${count === 1 ? '' : 's'}`,
        });
    }

    async onChooseSuggestion(match: Match) {
        this.getPrevItems().add(match);
        this.palette.open();
        this.palette.setQuery(`${this.plugin.settings.fileSearchPrefix}${QUERY_TAG}${match.text}`, 1);
    }
}
