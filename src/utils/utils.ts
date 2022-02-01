import { Hotkey, Modifier } from 'obsidian';

export const MODIFIER_ICONS = {
    Mod: '⌘',
    Ctrl: '^',
    Meta: '⌘',
    Alt: '⌥',
    Shift: '⇧',
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
 * A utility that generates the text of a Hotkey for UIs
 * @param hotkey Hotkey: The hotkey to generate text for
 * @returns string: The hotkey text
 */
export function generateHotKeyText(hotkey: Hotkey): string {
    const hotKeyStrings: string[] = [];
    hotkey.modifiers.forEach((mod: Modifier) => {
        hotKeyStrings.push(MODIFIER_ICONS[mod]);
    });

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key);

    return hotKeyStrings.join(' ');
}
