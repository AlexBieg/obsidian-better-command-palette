import {
    App, Instruction, normalizePath, TFile,
} from 'obsidian';
import {
    MODIFIER_ICONS,
    OrderedSet,
    PaletteMatch, SPECIAL_KEYS, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';
import BetterCommandPalettePlugin from 'src/main';

export default class BetterCommandPaletteFileAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    // Unsafe interface
    app: UnsafeAppInterface;

    allItems: Match[];

    unresolvedItems: OrderedSet<Match>;

    fileSearchPrefix: string;

    constructor(app: App, plugin: BetterCommandPalettePlugin) {
        super(app, new OrderedSet<Match>(), plugin);
    }

    initialize() {
        super.initialize();

        this.titleText = 'Better Command Palette: Files';
        this.emptyStateText = 'No matching files.⌘+Enter to create the file.';
        this.fileSearchPrefix = this.plugin.settings.fileSearchPrefix;

        this.allItems = [];

        this.unresolvedItems = new OrderedSet<Match>();

        Object.entries(this.app.metadataCache.unresolvedLinks)
            .forEach(([filePath, linkObject]: [string, Record<string, number>]) => {
                this.allItems.push(new PaletteMatch(filePath, filePath));
                Object.keys(linkObject).forEach(
                    (p) => this.unresolvedItems.add(new PaletteMatch(p, p)),
                );
            });

        this.allItems = this.allItems.concat(Array.from(this.unresolvedItems.values())).reverse();

        this.app.workspace.getLastOpenFiles().reverse().forEach((path) => {
            this.prevItems.add(new PaletteMatch(path, path));
        });
    }

    getInstructions(): Instruction[] {
        return [
            { command: SPECIAL_KEYS.ENTER, purpose: 'Open file' },
            { command: `${MODIFIER_ICONS.Shift} ${SPECIAL_KEYS.ENTER}`, purpose: 'Open file in new pane' },
            { command: `${MODIFIER_ICONS.Meta} ${SPECIAL_KEYS.ENTER}`, purpose: 'Create file' },
            { command: `${MODIFIER_ICONS.Meta} ${MODIFIER_ICONS.Shift} ${SPECIAL_KEYS.ENTER}`, purpose: 'Create file in new pane' },
            { command: `${SPECIAL_KEYS.ESC}`, purpose: 'Close palette' },
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

        if (this.unresolvedItems.has(match)) {
            suggestionEl.addClass('unresolved');
        }
    }

    async getOrCreateFile(path: string) : Promise<TFile> {
        let file = this.app.metadataCache.getFirstLinkpathDest(path, '');

        if (!file) {
            const normalizedPath = normalizePath(`${path}.md`);
            const dirOnlyPath = normalizedPath.split('/').slice(0, -1).join('/');

            try {
                await this.app.vault.createFolder(dirOnlyPath);
            } finally {
                // An error just means the folder path already exists
                file = await this.app.vault.create(normalizedPath, '');
            }
        }

        return file;
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        const { workspace } = this.app;
        let path = match && match.id;

        // No match means we are trying to create new file
        if (!match) {
            const el = event.target as HTMLInputElement;
            path = el.value.replace(this.fileSearchPrefix, '');
        }

        const file = await this.getOrCreateFile(path);

        // We might not have a file if only a directory was specified
        if (file) {
            this.getPrevItems().add(match || new PaletteMatch(file.path, file.path));
        }

        let leaf = workspace.activeLeaf;

        // Shift key means we should be using a new leaf
        if (event.shiftKey) {
            leaf = workspace.createLeafBySplit(workspace.activeLeaf);
            workspace.setActiveLeaf(leaf);
        }

        leaf.openFile(file);
    }
}
