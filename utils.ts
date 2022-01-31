import { App, Command, Hotkey, MetadataCache, SuggestModal} from "obsidian";
import { Comparable, Match } from "types";

export const MODIFIER_ICONS = {
    Mod: '⌘',
    Ctrl: '^',
    Meta: '⌘',
    Alt: '⌥',
    Shift: '⇧',
}

export const SPECIAL_KEYS : Record<string, string> = {
    TAB: "↹",
    ENTER: "↵",
    ARROWLEFT: "←",
    ARROWRIGHT: "→",
    ARROWUP: "↑",
    ARROWDOWN: "↓",
    BACKSPACE: "⌫",
    ESC: 'Esc',
}

/**
 * A utility set that keeps track of the last time an item was added to the
 * set even if it was already in the set.
 */
export class OrderedSet<T extends Comparable> {
    private map: Map<string, T>;

    constructor(values: Iterable<T> = []) {
        this.map = new Map<string, T>()
        for (const v of values) {
            this.map.set(v.value(), v);
        }
    }

    has(item: T) : boolean {
        return this.map.has(item.value());
    }

    add(item: T) {
        this.delete(item);

        return this.map.set(item.value(), item);
    }

    delete(item: T) {
        this.map.delete(item.value())
    }

    values(): T[] {
        return Array.from(this.map.values())
    }

    valuesByLastAdd(): T[] {
        return Array.from(this.map.values()).reverse()
    }
}

export class PaletteMatch implements Match {
    id: string;
    text: string;

    constructor(id: string, text: string) {
        this.id = id;
        this.text = text;
    }

    value() : string {
        return this.id;
    }
}

/**
 * A class that can be used by the palette modal to abstact away item specific logic between:
 * Commands, Files, and Tags
 */
export abstract class SuggestModalAdapter {
    app: App;
    prevItems: OrderedSet<Match>;
    recentAbovePinned: boolean;
    pinnedItems: Match[];
    initialized: boolean;
    allItems: Match[];

    abstract getTitleText(): string;
    abstract getEmptyStateText():  string;
    abstract renderSuggestion(match: Match, el: HTMLElement):  void;
    abstract onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent):  void;

    constructor(app: App, prevItems: OrderedSet<Match>, recentAbovePinned: boolean) {
        this.app = app;
        this.prevItems = prevItems;
        this.recentAbovePinned = recentAbovePinned;
        this.allItems = []
        this.pinnedItems = [];
        this.initialized = false;
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
        this.checkInitialized()
        return this.pinnedItems;
    }

    getItems(): Match[] {
        this.checkInitialized()
        return this.allItems;
    }

    getPrevItems(): OrderedSet<Match> {
        return this.prevItems;
    }

    getSortedItems(): Match[] {
        const allItems = new OrderedSet(this.getItems());

        // TODO: Clean up this logic. If we ever have more than two things this will not work.
        const firstItems = this.recentAbovePinned ? this.getPrevItems().values() : this.getPinnedItems();
        const secondItems = !this.recentAbovePinned ? this.getPrevItems().values() : this.getPinnedItems();

        const itemsToAdd = [secondItems, firstItems];

        for (const toAdd of itemsToAdd) {
            for (const i of toAdd) {
                if (allItems.has(i)) {
                    // Bring it to the top
                    allItems.add(i);
                }
            }
        }

        return allItems.valuesByLastAdd();
    }

}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param hotkey Hotkey: The hotkey to generate text for
 * @returns string: The hotkey text
 */
export function generateHotKeyText(hotkey: Hotkey): string {
    var hotKeyStrings: string[] = [];
    for (const mod of hotkey.modifiers) {
        hotKeyStrings.push(MODIFIER_ICONS[mod])
    }

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key)

    return hotKeyStrings.join(' ')
}

// Unsafe Interfaces
// Ideally we would not have to use these, but as far as I can tell they are the only way for certain
// functionality.
// Copied this pattern from Another Quick Switcher: https://github.com/tadashi-aikawa/obsidian-another-quick-switcher/blob/master/src/ui/AnotherQuickSwitcherModal.ts#L109

export interface UnsafeSuggestModalInterface extends SuggestModal<Match> {
    chooser: {
        useSelectedItem(ev: Partial<KeyboardEvent>): void;
    }
    updateSuggestions(): void;
}

interface UnsafeMetadataCacheInterface extends MetadataCache {
    getCachedFiles(): string[],
}

export interface UnsafeAppInterface extends App {
    commands: {
        listCommands(): Command[],
        findCommand(id: string): Command,
        executeCommandById(id: string): void,
    },
    hotkeyManager: {
        getHotkeys(id: string): Hotkey[],
        getDefaultHotkeys(id: string): Hotkey[],
    },
    metadataCache: UnsafeMetadataCacheInterface,
    internalPlugins: {
        getPluginById(id: string): { instance: { options: { pinned: [] }}},
    }
}