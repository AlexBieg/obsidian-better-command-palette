import { Hotkey} from "obsidian";
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
