import { Hotkey, Modifier } from 'obsidian';

const HYPER_KEY_MODIFIERS_SET = new Set(['Alt', 'Ctrl', 'Mod', 'Shift']);

export const MODIFIER_ICONS = {
    Mod: '⌘',
    Ctrl: '^',
    Meta: '⌘',
    Alt: '⌥',
    Shift: '⇧',
    Hyper: '⇪',
};

export const SPECIAL_KEYS : Record<string, string> = {
    TAB: '↹',
    ENTER: '↵',
    ARROWLEFT: '←',
    ARROWRIGHT: '→',
    ARROWUP: '↑',
    ARROWDOWN: '↓',
    BACKSPACE: '⌫',
    ESC: 'Esc',
};

/**
 * Determines if the modifiers of a hotkey could be a hyper key command.
 * @param {Modifier[]} modifiers An array of modifiers
 * @returns {boolean} Do the modifiers make up a hyper key command
 */
function isHyperKey(modifiers: Modifier[]) : boolean {
    if (modifiers.length !== 4) {
        return false;
    }

    return modifiers.every((m) => HYPER_KEY_MODIFIERS_SET.has(m));
}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param {Hotkey} hotkey The hotkey to generate text for
 * @returns {string} The hotkey text
 */
export function generateHotKeyText(hotkey: Hotkey, useHyperKey: boolean = false): string {
    const hotKeyStrings: string[] = [];

    if (useHyperKey && isHyperKey(hotkey.modifiers)) {
        hotKeyStrings.push(MODIFIER_ICONS.Hyper);
    } else {
        hotkey.modifiers.forEach((mod: Modifier) => {
            hotKeyStrings.push(MODIFIER_ICONS[mod]);
        });
    }

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key);

    return hotKeyStrings.join(' ');
}
