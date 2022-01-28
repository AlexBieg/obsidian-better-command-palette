import { Hotkey } from "obsidian";

export const MODIFIER_ICONS = {
    Mod: '⌘',
    Ctrl: '^',
    Meta: '⌘',
    Alt: '⌥',
    Shift: '⇧',
    Capslock: '⇪',
}

export const SPECIAL_KEYS : Record<string, string> = {
    TAB: "↹",
    ENTER: "↵",
    ARROWLEFT: "←",
    ARROWRIGHT: "→",
    ARROWUP: "↑",
    ARROWDOWN: "↓",
    BACKSPACE: "⌫",
    ESC: "Esc",
}

/**
 * A utility set that keeps track of the last time an item was added to the
 * set even if it was already in the set.
 */
export class OrderedSet<T> extends Set<T> {
    add(item: T) {
        if (this.has(item)) {
            this.delete(item);
        }

        return super.add(item);
    }

    valuesByLastAdd(): T[] {
        return Array.from(this).reverse()
    }
}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param hotkey Hotkey: The hotkey to generate text for
 * @returns string: The hotkey text
 */
export function generateHotKeyText(hotkey: Hotkey): string {
    var hotKeyStrings: string[] = [];
    if (hotkey.modifiers.length === 4) {
        // for Mac users using the Hyper Key https://holmberg.io/hyper-key/
        hotKeyStrings.push(MODIFIER_ICONS["Capslock"]);
    } else {
        for (const mod of hotkey.modifiers) {
            hotKeyStrings.push(MODIFIER_ICONS[mod])
        }
    }

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key)

    return hotKeyStrings.join(' ')
}
