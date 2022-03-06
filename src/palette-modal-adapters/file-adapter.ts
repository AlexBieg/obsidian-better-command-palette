import {
    Instruction, setIcon,
} from 'obsidian';
import {
    generateHotKeyText,
    getOrCreateFile,
    openFileWithEventKeys,
    OrderedSet,
    PaletteMatch, SuggestModalAdapter,
    createPaletteMatchesFromFilePath,
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

        this.hiddenIds = this.plugin.settings.hiddenFiles;
        this.hiddenIdsSettingsKey = 'hiddenFiles';

        this.allItems = [];

        this.unresolvedItems = new OrderedSet<Match>();

        // Actually returns all files in the cache even if there are no unresolved links
        this.app.metadataCache.getCachedFiles()
            .forEach((filePath: string) => {
                const matches = createPaletteMatchesFromFilePath(this.app.metadataCache, filePath);
                this.allItems = this.allItems.concat(matches);

                // Add any unresolved links to the set
                Object.keys(this.app.metadataCache.unresolvedLinks[filePath] || {}).forEach(
                    (p) => this.unresolvedItems.add(new PaletteMatch(p, p)),
                );
            });

        // Add the deduped links to all items
        this.allItems = this.allItems.concat(Array.from(this.unresolvedItems.values())).reverse();

        // Use obsidian's last open files as the previous items
        [...this.app.workspace.getLastOpenFiles()].reverse().forEach((filePath) => {
            const matches = createPaletteMatchesFromFilePath(this.app.metadataCache, filePath);

            // For previous items we only want the actual file, not any aliases
            if (matches[0]) {
                this.prevItems.add(matches[0]);
            }
        });
    }

    getInstructions(): Instruction[] {
        const { createNewPaneMod, createNewFileMod } = this.plugin.settings;

        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'Open file' },
            { command: generateHotKeyText({ modifiers: [createNewPaneMod], key: 'ENTER' }, this.plugin.settings), purpose: 'Open file in new pane' },
            { command: generateHotKeyText({ modifiers: [createNewFileMod], key: 'ENTER' }, this.plugin.settings), purpose: 'Create file' },
            { command: generateHotKeyText({ modifiers: [createNewFileMod, createNewPaneMod], key: 'ENTER' }, this.plugin.settings), purpose: 'Create file in new pane' },
            { command: generateHotKeyText({ modifiers: [], key: 'ESC' }, this.plugin.settings), purpose: 'Close palette' },
            { command: generateHotKeyText({ modifiers: [], key: 'BACKSPACE' }, this.plugin.settings), purpose: 'Search Commands' },
            { command: this.plugin.settings.tagSearchPrefix, purpose: 'Search Tags' },
        ];
    }

    cleanQuery(query: string): string {
        const newQuery = query.replace(this.fileSearchPrefix, '');
        return newQuery;
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        const suggestionEl = el.createEl('div', {
            cls: 'suggestion-content',
            text: match.text,
        });

        if (this.unresolvedItems.has(match)) {
            suggestionEl.addClass('unresolved');
        }

        if (match.id.includes(':')) {
            // Set Icon will destroy the first element in a node. So we need to add one back
            suggestionEl.createEl('div', {
                cls: 'suggestion-name',
                text: match.text,
            }).ariaLabel = 'Alias';

            setIcon(suggestionEl, 'right-arrow-with-tail');

            const [, path] = match.id.split(':');
            suggestionEl.createEl('div', {
                cls: 'suggestion-description',
                text: path,
            });
        }

        el.createEl('div', {
            cls: 'suggestion-sub-content',
            text: `${match.tags.join(' ')}`,
        });
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        let path = match && match.id;

        // No match means we are trying to create new file
        if (!match) {
            const el = event.target as HTMLInputElement;
            path = el.value.replace(this.fileSearchPrefix, '');
        } else if (path.includes(':')) {
            // If the path is an aliase, remove the alias prefix
            [, path] = path.split(':');
        }

        const file = await getOrCreateFile(this.app, path);

        // We might not have a file if only a directory was specified
        if (file) {
            this.getPrevItems().add(match || new PaletteMatch(file.path, file.path));
        }

        openFileWithEventKeys(this.app, this.plugin.settings, file, event);
    }
}
