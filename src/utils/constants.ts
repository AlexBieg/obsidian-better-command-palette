import { Modifier } from 'obsidian';

export const QUERY_OR = '||';
export const QUERY_TAG = '@';

export const HYPER_KEY_MODIFIERS_SET = new Set<Modifier>(['Alt', 'Ctrl', 'Mod', 'Shift']);

export type ModifierInfo = {
    // The name/symbol to use for each icon.
    icons: Readonly<Record<Modifier | 'Hyper', string>>;
    // The string used to separate modifiers from what they modify.
    separator: string;
    // The order used when hotkeys are rendered.
    hotkeyOrder: readonly Modifier[];
    // The order in which modifier buttons appear.
    buttonOrder: readonly Modifier[];
};

export const MODIFIER_INFO: Record<'windows' | 'mac', ModifierInfo> = {
    windows: {
        icons: {
            Mod: 'Ctrl',
            Ctrl: 'Ctrl',
            Meta: 'Win',
            Alt: 'Alt',
            Shift: 'Shift',
            Hyper: 'Caps',
        },
        separator: ' + ',
        // This is the order Obsidian uses on Windows, with 'Ctrl' inserted after 'Mod'.
        hotkeyOrder: ['Mod', 'Ctrl', 'Meta', 'Alt', 'Shift'],
        // This order is based on how often various modifiers are used, with
        // 'Shift' demoted somewhat because it's not a useful modifier on its
        // own.
        buttonOrder: ['Mod', 'Alt', 'Shift', 'Meta'],
    },
    mac: {
        icons: {
            Mod: '⌘',
            Ctrl: '^',
            Meta: '⌘',
            Alt: '⌥',
            Shift: '⇧',
            Hyper: '⇪',
        },
        separator: ' ',
        // This is the order Apple specifies, with 'Meta' added after 'Mod'.
        hotkeyOrder: ['Shift', 'Ctrl', 'Alt', 'Mod', 'Meta'],
        // Just Apple's order, nothing extra.
        buttonOrder: ['Shift', 'Ctrl', 'Alt', 'Mod'],
    },
};

export const SPECIAL_KEYS: Record<string, string> = {
    Tab: '↹',
    Enter: '↵',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Backspace: '⌫',
    Escape: 'Esc',
    ' ': 'Space',
};

export const MACRO_COMMAND_ID_PREFIX = 'obsidian-better-command-palette-macro-';

export enum ActionType {
    Commands,
    Files,
    Tags,
    Hotkey,
}
