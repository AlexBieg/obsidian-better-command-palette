import { App, Instruction, normalizePath } from 'obsidian';
import {
    OrderedSet,
    PaletteMatch, SuggestModalAdapter,
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

        this.allItems = this.allItems.concat(Array.from(this.unresolvedItems.values()));

        this.app.workspace.getLastOpenFiles().reverse().forEach((path) => {
            this.prevItems.add(new PaletteMatch(path, path));
        });
    }

    getInstructions(): Instruction[] {
        return [
            { command: 'Enter', purpose: 'Open file' },
            { command: '⇧ Enter', purpose: 'Open file in new pane' },
            { command: '⌘ Enter', purpose: 'Create file' },
            { command: '⌘ ⇧ Enter', purpose: 'Create file in new pane' },
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

    async onChooseSuggestion(possbileMatch: Match, event: MouseEvent | KeyboardEvent) {
        let file = null;
        let match = possbileMatch;

        if (!match) {
            const el = event.target as HTMLInputElement;
            const path = normalizePath(`${el.value.replace(this.fileSearchPrefix, '')}.md`);

            file = await this.app.vault.create(path, '');
            match = new PaletteMatch(file.path, file.path);
        } else {
            file = this.app.metadataCache.getFirstLinkpathDest(match.id, '');

            if (!file) {
                const path = normalizePath(`${match.id}.md`);
                file = await this.app.vault.create(path, '');
            }
        }

        this.getPrevItems().add(match);
        const { workspace } = this.app;

        if (event.shiftKey) {
            const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
            newLeaf.openFile(file);
            workspace.setActiveLeaf(newLeaf);
        } else {
            workspace.activeLeaf.openFile(file);
        }
    }
}
