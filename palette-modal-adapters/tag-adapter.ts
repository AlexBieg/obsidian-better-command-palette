import { App } from "obsidian";
import { Match } from "types";
import { OrderedSet, PaletteMatch, SuggestModalAdapter } from "utils";

export class BetterCommandPaletteTagAdapter extends SuggestModalAdapter {
    allItems: Match[];
    tagSearchPrefix: string;

    constructor(app: App, prevItems: OrderedSet<Match>, recentAbovePinned: boolean, tagSearchPrefix: string) {
        super(app, prevItems, recentAbovePinned);
        this.tagSearchPrefix = tagSearchPrefix;
    }

    initialize(): void {
        super.initialize();

        // @ts-ignore get all files with tags
        this.allItems = this.app.metadataCache.getCachedFiles().reduce((acc: PaletteMatch[], path: string) => {
            const fileCache = this.app.metadataCache.getCache(path);
            if (fileCache.tags) {
                const tagString = fileCache.tags.map(tc => tc.tag).join(' ');
                acc.push(new PaletteMatch(path, tagString))
            }

            return acc;
        }, []);
    }

    cleanQuery(query: string): string {
        return query.replace(this.tagSearchPrefix, '');
    }

    getTitleText(): string {
        return 'Better Command Palette: Tags';
    }

    getEmptyStateText(): string {
        return 'No matching tags.';
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

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        this.getPrevItems().add(match);
        const file = this.app.metadataCache.getFirstLinkpathDest(match.id, '');
        this.app.workspace.activeLeaf.openFile(file);
    };

}