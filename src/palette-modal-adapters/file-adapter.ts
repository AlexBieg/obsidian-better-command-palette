import {
    Instruction,
} from 'obsidian';
import {
    generateHotKeyText,
    getOrCreateFile,
    openFileWithEventKeys,
    OrderedSet,
    PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';

export default class BetterCommandPaletteFileAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    // Unsafe interface
    app: UnsafeAppInterface;

    allItems: Match[];

    unresolvedItems: OrderedSet<Match>;

    fileSearchPrefix: string;

    initialize() {
        super.initialize();

        this.titleText = 'Better Command Palette: Files';
        this.emptyStateText = 'No matching files.';
        this.fileSearchPrefix = this.plugin.settings.fileSearchPrefix;

        this.allItems = [];

        this.unresolvedItems = new OrderedSet<Match>();

        // Actually returns all files in the cache even if there are no unresolved links
        Object.entries(this.app.metadataCache.unresolvedLinks)
            .forEach(([filePath, linkObject]: [string, Record<string, number>]) => {
                // Get the cache item for the file so that we can extract its tags
                const fileCache = this.app.metadataCache.getCache(filePath);

                // Sometimes the cache keeps files that have been deleted
                if (!fileCache) return;

                // Make the palette match
                this.allItems.push(new PaletteMatch(
                    filePath,
                    filePath,
                    (fileCache.tags || []).map((tc) => tc.tag),
                ));

                // Add any unresolved links to the set
                Object.keys(linkObject).forEach(
                    (p) => this.unresolvedItems.add(new PaletteMatch(p, p)),
                );
            });

        // Add the deduped links to all items
        this.allItems = this.allItems.concat(Array.from(this.unresolvedItems.values())).reverse();

        // Use obsidian's last open files as the previous items
        this.app.workspace.getLastOpenFiles().reverse().forEach((path) => {
            const fileCache = this.app.metadataCache.getCache(path);

            // Sometimes the cache keeps files that have been deleted
            if (!fileCache) return;

            this.prevItems.add(
                new PaletteMatch(path, path, (fileCache.tags || []).map((tc) => tc.tag)),
            );
        });
    }

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'Open file' },
            { command: generateHotKeyText({ modifiers: ['Shift'], key: 'ENTER' }, this.plugin.settings), purpose: 'Open file in new pane' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: 'ENTER' }, this.plugin.settings), purpose: 'Create file' },
            { command: generateHotKeyText({ modifiers: ['Mod', 'Shift'], key: 'ENTER' }, this.plugin.settings), purpose: 'Create file in new pane' },
            { command: generateHotKeyText({ modifiers: [], key: 'ESC' }, this.plugin.settings), purpose: 'Close palette' },
        ];
    }

    cleanQuery(query: string): string {
        const newQuery = query.replace(this.fileSearchPrefix, '');
        return newQuery;
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        const suggestionEl = el.createEl('span', {
            cls: 'suggestion-content',
            text: match.text,
        });

        el.createEl('span', {
            cls: 'suggestion-sub-content',
            text: `${match.tags.join(' ')}`,
        });

        if (this.unresolvedItems.has(match)) {
            suggestionEl.addClass('unresolved');
        }
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        let path = match && match.id;

        // No match means we are trying to create new file
        if (!match) {
            const el = event.target as HTMLInputElement;
            path = el.value.replace(this.fileSearchPrefix, '');
        }

        const file = await getOrCreateFile(this.app, path);

        // We might not have a file if only a directory was specified
        if (file) {
            this.getPrevItems().add(match || new PaletteMatch(file.path, file.path));
        }

        openFileWithEventKeys(this.app, file, event);
    }
}
