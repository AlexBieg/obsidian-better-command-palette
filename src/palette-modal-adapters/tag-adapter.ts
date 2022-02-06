import { Instruction } from 'obsidian';
import {
    PaletteMatch, SPECIAL_KEYS, SuggestModalAdapter,
}
    from 'src/utils';
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

        this.allItems = this.app.metadataCache
            .getCachedFiles().reduce((acc: PaletteMatch[], path: string) => {
                const fileCache = this.app.metadataCache.getCache(path);
                if (fileCache.tags) {
                    const tagString = fileCache.tags.map((tc) => tc.tag).join(' ');
                    acc.push(new PaletteMatch(path, tagString));
                }

                return acc;
            }, []);
    }

    getInstructions(): Instruction[] {
        return [
            { command: SPECIAL_KEYS.ENTER, purpose: 'Open file' },
            { command: `${SPECIAL_KEYS.ESC}`, purpose: 'Close palette' },
        ];
    }

    cleanQuery(query: string): string {
        return query.replace(this.tagSearchPrefix, '');
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        el.createEl('span', {
            cls: 'suggestion-content',
            text: match.id, // We're storing the file path in the id
        });

        el.createEl('span', {
            cls: 'suggestion-sub-content',
            text: match.text,
        });
    }

    async onChooseSuggestion(match: Match) {
        this.getPrevItems().add(match);
        const file = this.app.metadataCache.getFirstLinkpathDest(match.id, '');
        this.app.workspace.activeLeaf.openFile(file);
    }
}
