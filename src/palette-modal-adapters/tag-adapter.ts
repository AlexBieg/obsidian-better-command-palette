import { Instruction } from 'obsidian';
import {
    generateHotKeyText,
    PaletteMatch, SuggestModalAdapter,
}
    from 'src/utils';
import { QUERY_TAG } from 'src/utils/constants';
import { Match, UnsafeAppInterface } from '../types/types';

export default class BetterCommandPaletteTagAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    // Unsafe interface
    app: UnsafeAppInterface;

    allItems: Match[];

    tagSearchPrefix: string;

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

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'See file usage' },
            { command: generateHotKeyText({ modifiers: [], key: 'BACKSPACE' }, this.plugin.settings), purpose: 'Search Commands' },
            { command: this.plugin.settings.fileSearchPrefix, purpose: 'Search Files' },
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
        this.palette.setQuery(`/${QUERY_TAG}${match.text}`, 1);
    }
}
