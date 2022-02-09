import { Instruction } from 'obsidian';
import {
    generateHotKeyText,
    getOrCreateFile,
    openFileWithEventKeys,
    OrderedSet,
    PaletteMatch, SuggestModalAdapter,
}
    from 'src/utils';
import { QUERY_OR } from 'src/utils/constants';
import { Match, UnsafeAppInterface } from '../types/types';

export default class BetterCommandPaletteTagAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    // Unsafe interface
    app: UnsafeAppInterface;

    allItems: Match[];

    tagsToFiles: Map<string, string[]>;

    tagSearchPrefix: string;

    initialize(): void {
        super.initialize();

        this.tagSearchPrefix = this.plugin.settings.tagSearchPrefix;
        this.titleText = 'Better Command Palette: Tags';
        this.emptyStateText = 'No matching tags.';
        this.tagsToFiles = new Map();

        this.allItems = this.app.metadataCache
            .getCachedFiles().reduce((acc: OrderedSet<PaletteMatch>, path: string) => {
                const fileCache = this.app.metadataCache.getCache(path);
                (fileCache.tags || []).forEach((tc) => {
                    const { tag } = tc;
                    const fileList = this.tagsToFiles.get(tag) || [];

                    fileList.push(path);
                    this.tagsToFiles.set(tc.tag, fileList);
                    acc.add(new PaletteMatch(tag, tag));
                });

                return acc;
            }, new OrderedSet()).values();
    }

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'Open file' },
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

        const filePaths = this.tagsToFiles.get(match.id);

        el.createEl('span', {
            cls: 'suggestion-sub-content',
            text: `Found in ${filePaths.length} file${filePaths.length === 1 ? '' : 's'}`,
        });
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        this.getPrevItems().add(match);
        const filePaths = this.tagsToFiles.get(match.id);

        if (filePaths.length === 1) {
            // If there is only one file, might as well open it
            const file = await getOrCreateFile(this.app, filePaths[0]);
            openFileWithEventKeys(this.app, file, event);
        } else {
            // If more than one file we should show them all of the files in the file search
            this.palette.open();
            this.palette.setQuery(`/${filePaths.join(QUERY_OR)}`);
        }
    }
}
