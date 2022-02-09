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

        this.tagSearchPrefix = this.plugin.settings.tagSearchPrefix;
        this.titleText = 'Better Command Palette: Tags';
        this.emptyStateText = 'No matching tags.';

        this.allItems = Object.keys(this.app.metadataCache.getTags())
            .map((tag) => new PaletteMatch(tag, tag));
    }

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'See file usage' },
            { command: generateHotKeyText({ modifiers: [], key: 'ESC' }, this.plugin.settings), purpose: 'Close Palette' },
        ];
    }

    cleanQuery(query: string): string {
        return query.replace(this.tagSearchPrefix, '');
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        el.createEl('span', {
            cls: 'suggestion-content',
            text: match.text,
        });

        const count = this.app.metadataCache.getTags()[match.text];

        el.createEl('span', {
            cls: 'suggestion-sub-content',
            text: `Found in ${count} file${count === 1 ? '' : 's'}`,
        });
    }

    async onChooseSuggestion(match: Match) {
        this.getPrevItems().add(match);
        this.palette.open();
        this.palette.setQuery(`/${QUERY_TAG}${match.text}`, 1);
    }
}
