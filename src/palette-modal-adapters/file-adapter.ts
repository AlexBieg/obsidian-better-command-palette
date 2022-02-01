import { App, normalizePath } from 'obsidian';
import {
    OrderedSet, PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';

export default class BetterCommandPaletteFileAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    // Unsafe interface
    app: UnsafeAppInterface;

    allItems: Match[];

    fileSearchPrefix: string;

    constructor(
        app: App,
        prevItems: OrderedSet<Match>,
        recentAbovePinned: boolean,
        fileSearchPrefix: string,
    ) {
        super(app, prevItems, recentAbovePinned);
        this.titleText = 'Better Command Palette: Files';
        this.emptyStateText = 'No matching files.⌘+Enter to create the file.';
        this.fileSearchPrefix = fileSearchPrefix;
    }

    initialize() {
        super.initialize();

        this.allItems = this.app.metadataCache.getCachedFiles()
            .reverse() // Reversed because we want it sorted A -> Z
            .map((path: string) => new PaletteMatch(path, path));
    }

    cleanQuery(query: string): string {
        const newQuery = query.replace(this.fileSearchPrefix, '');
        return newQuery;
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        el.createEl('span', {
            cls: 'suggestion-content',
            text: match.text,
        });
    }

    async onChooseSuggestion(possbileMatch: Match, event: MouseEvent | KeyboardEvent) {
        let created = false;
        let file = null;
        let match = possbileMatch;

        if (!match) {
            created = true;

            const el = event.target as HTMLInputElement;
            const path = normalizePath(`${el.value.replace(this.fileSearchPrefix, '')}.md`);

            file = await this.app.vault.create(path, '');
            match = new PaletteMatch(file.path, file.path);
        } else {
            file = this.app.metadataCache.getFirstLinkpathDest(match.id, '');
        }

        this.getPrevItems().add(match);
        const { workspace } = this.app;

        if (event.metaKey && !created) {
            const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf);
            newLeaf.openFile(file);
            workspace.setActiveLeaf(newLeaf);
        } else {
            workspace.activeLeaf.openFile(file);
        }
    }
}
