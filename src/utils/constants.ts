import { Modifier } from 'obsidian';

export const QUERY_OR = '||';
export const QUERY_TAG = '@';

export const HYPER_KEY_MODIFIERS_SET = new Set<Modifier>(['Alt', 'Ctrl', 'Mod', 'Shift']);

export type ModifierInfo = {
    icons: Readonly<Record<Modifier | 'Hyper', string>>;
    separator: string;
    order: readonly Modifier[];
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
        order: ['Mod', 'Alt', 'Shift', 'Meta'],
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
        order: ['Shift', 'Ctrl', 'Alt', 'Mod'],
    },
};

export const SPECIAL_KEYS: Record<string, string> = {
    TAB: '↹',
    ENTER: '↵',
    ARROWLEFT: '←',
    ARROWRIGHT: '→',
    ARROWUP: '↑',
    ARROWDOWN: '↓',
    BACKSPACE: '⌫',
    ESC: 'Esc',
    ' ': 'Space',
};

export const MACRO_COMMAND_ID_PREFIX = 'obsidian-better-command-palette-macro-';

export enum ActionType {
    Commands,
    Files,
    Tags,
    Hotkey,
}
