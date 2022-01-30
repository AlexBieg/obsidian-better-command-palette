import { App } from "obsidian";
import { Match } from "types";
import { OrderedSet, PaletteMatch, SuggestModalAdapter } from "utils";

export class BetterCommandPaletteTagAdapter extends SuggestModalAdapter {
    allItems: Match[];

    constructor(app: App, prevItems: OrderedSet<Match>, recentAbovePinned: boolean) {
        super(app, prevItems, recentAbovePinned)

        // @ts-ignore Can't find another way to access tags.
        this.allItems = Object.keys(this.app.metadataCache.getTags())
            .map((tag) => new PaletteMatch(tag, tag));
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
            text: match.text,
        });
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        this.getPrevItems().add(match);
        // @ts-ignore
        this.app.internalPlugins.plugins['global-search'].instance.openGlobalSearch(`tag:${match.text}`)
        console.log(match);
    };

}