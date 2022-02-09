import { App, Instruction } from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import BetterCommandPaletteModal from 'src/palette';
import { Match } from 'src/types/types';
import OrderedSet from 'src/utils/ordered-set';

/**
 * A class that can be used by the palette modal to abstact away item specific logic between:
 * Commands, Files, and Tags
 */
export default abstract class SuggestModalAdapter {
    app: App;

    plugin: BetterCommandPalettePlugin;

    palette: BetterCommandPaletteModal;

    prevItems: OrderedSet<Match>;

    recentAbovePinned: boolean;

    pinnedItems: Match[];

    initialized: boolean;

    allItems: Match[];

    abstract titleText: string;

    abstract emptyStateText: string;

    abstract renderSuggestion(match: Match, el: HTMLElement): void;
    abstract onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent): void;

    constructor(
        app: App,
        prevItems: OrderedSet<Match>,
        plugin: BetterCommandPalettePlugin,
        palette: BetterCommandPaletteModal,
    ) {
        this.app = app;
        this.prevItems = prevItems;
        this.recentAbovePinned = plugin.settings.recentAbovePinned;
        this.plugin = plugin;
        this.palette = palette;
        this.allItems = [];
        this.pinnedItems = [];
        this.initialized = false;
    }

    getTitleText(): string {
        return this.titleText;
    }

    getEmptyStateText(): string {
        return this.emptyStateText;
    }

    getInstructions(): Instruction[] {
        return [];
    }

    checkInitialized() {
        if (!this.initialized) {
            throw new Error('This adapter has not been initialized');
        }
    }

    initialize() {
        this.initialized = true;
    }

    cleanQuery(query: string) {
        return query;
    }

    getPinnedItems(): Match[] {
        this.checkInitialized();
        return this.pinnedItems;
    }

    getItems(): Match[] {
        this.checkInitialized();
        return this.allItems;
    }

    getPrevItems(): OrderedSet<Match> {
        return this.prevItems;
    }

    getSortedItems(): Match[] {
        const allItems = new OrderedSet(this.getItems());

        // TODO: Clean up this logic. If we ever have more than two things this will not work.
        const firstItems = this.recentAbovePinned
            ? this.getPrevItems().values() : this.getPinnedItems();
        const secondItems = !this.recentAbovePinned
            ? this.getPrevItems().values() : this.getPinnedItems();

        const itemsToAdd = [secondItems, firstItems];

        itemsToAdd.forEach((toAdd) => {
            toAdd.forEach((item) => {
                if (allItems.has(item)) {
                    // Bring it to the top
                    allItems.add(item);
                }
            });
        });

        return allItems.valuesByLastAdd();
    }
}
