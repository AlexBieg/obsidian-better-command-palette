import {
    PluginSettingTab, Plugin, Command, Hotkey, MetadataCache, App, SuggestModal,
} from 'obsidian';
import { OrderedSet } from 'src/utils';

interface MacroCommandInterface {
    commandIds: string[],
    name: string,
    delay: number,
}

export interface BetterCommandPaletteInterface extends Plugin {
    settings: PluginSettingTab;

    prevCommands: OrderedSet<Match>;

    prevFiles: OrderedSet<Match>;

    prevTags: OrderedSet<Match>;

    suggestionsWorker: Worker;
}

export interface Comparable {
    value: () => string;
}

export interface Match extends Comparable {
    text: string,
    id: string,
    tags: string[],
}

// Unsafe Interfaces
// Ideally we would not have to use these, but as far as I can tell
// they are the only way for certain functionality.
// Copied this pattern from Another Quick Switcher: https://github.com/tadashi-aikawa/obsidian-another-quick-switcher/blob/master/src/ui/AnotherQuickSwitcherModal.ts#L109

export interface UnsafeSuggestModalInterface extends SuggestModal<Match> {
    chooser: {
        useSelectedItem(ev: Partial<KeyboardEvent>): void;
        selectedItem: Match,
    }
    updateSuggestions(): void;
}

interface UnsafeMetadataCacheInterface extends MetadataCache {
    getCachedFiles(): string[],
    getTags(): Record<string, number>;
}

export interface UnsafeAppInterface extends App {
    commands: {
        listCommands(): Command[],
        findCommand(id: string): Command,
        removeCommand(id: string): void,
        executeCommandById(id: string): void,
        commands: Record<string, Command>,
    },
    hotkeyManager: {
        getHotkeys(id: string): Hotkey[],
        getDefaultHotkeys(id: string): Hotkey[],
    },
    metadataCache: UnsafeMetadataCacheInterface,
    internalPlugins: {
        getPluginById(id: string): { instance: { options: { pinned: [] } } },
    }
}

type HotkeyStyleType = 'auto' | 'mac' | 'windows';

type Message = {
    data: {
        query: string,
        items: Match[],
    }
};
