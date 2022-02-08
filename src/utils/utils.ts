import { Hotkey, Modifier, Platform } from 'obsidian';
import { BetterCommandPalettePluginSettings } from 'src/settings';

const HYPER_KEY_MODIFIERS_SET = new Set(['Alt', 'Ctrl', 'Mod', 'Shift']);

const BASIC_MODIFIER_ICONS = {
    Mod: 'Ctrl',
    Ctrl: 'Ctrl',
    Meta: 'Win',
    Alt: 'Alt',
    Shift: 'Shift',
    Hyper: 'Caps',
};

const MAC_MODIFIER_ICONS = {
    Mod: '⌘',
    Ctrl: '^',
    Meta: '⌘',
    Alt: '⌥',
    Shift: '⇧',
    Hyper: '⇪',
};

export const MODIFIER_ICONS = Platform.isMacOS ? MAC_MODIFIER_ICONS : BASIC_MODIFIER_ICONS;

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

export const MACRO_COMMAND_ID_PREFIX = 'obsidian-better-command-palette-macro-';

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
export function generateHotKeyText(
    hotkey: Hotkey,
    settings: BetterCommandPalettePluginSettings,
): string {
    let modifierIcons = MODIFIER_ICONS;

    if (settings.hotkeyStyle === 'mac') {
        modifierIcons = MAC_MODIFIER_ICONS;
    } else if (settings.hotkeyStyle === 'windows') {
        modifierIcons = BASIC_MODIFIER_ICONS;
    }

    const hotKeyStrings: string[] = [];

    if (settings.hyperKeyOverride && isHyperKey(hotkey.modifiers)) {
        hotKeyStrings.push(modifierIcons.Hyper);
    } else {
        hotkey.modifiers.forEach((mod: Modifier) => {
            hotKeyStrings.push(modifierIcons[mod]);
        });
    }

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key);

    return hotKeyStrings.join(' ');
}
