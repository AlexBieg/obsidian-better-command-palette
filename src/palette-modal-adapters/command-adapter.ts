import { Command, Instruction, setIcon } from 'obsidian';
import {
    generateHotKeyText, PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { ActionType } from 'src/utils/constants';

export default class BetterCommandPaletteCommandAdapter extends SuggestModalAdapter {
    titleText!: string;

    emptyStateText!: string;

    COMMAND_PLUGIN_NAME_SEPARATOR = ': ';

    // Unsafe Interfaces
    declare app: UnsafeAppInterface;

    allItems!: Match[];

    pinnedItems!: Match[];

    initialize() {
        super.initialize();

        this.titleText = 'Better Command Palette: Commands';
        this.emptyStateText = 'No matching commands.';

        this.hiddenIds = this.plugin.settings.hiddenCommands;
        this.hiddenIdsSettingsKey = 'hiddenCommands';

        this.allItems = this.app.commands.listCommands()
            .sort((a: Command, b: Command) => b.name.localeCompare(a.name))
            .map((c: Command): Match => new PaletteMatch(c.id, c.name));

        const pinnedCommands = this.app.internalPlugins.getPluginById('command-palette').instance.options.pinned || [];
        this.pinnedItems = pinnedCommands.reduce(
            (acc: Match[], id: string): Match[] => {
                const command = this.app.commands.findCommand(id);

                // If a command was pinned and then the plugin removed we won't have a command here
                if (command) {
                    acc.push(new PaletteMatch(id, command.name));
                }

                return acc;
            },
            [],
        ).reverse();
    }

    mount(): void {
        this.keymapHandlers = [
            this.palette.scope.register(['Mod'], this.plugin.settings.fileSearchHotkey, () => this.palette.changeActionType(ActionType.Files)),
            this.palette.scope.register(['Mod'], this.plugin.settings.tagSearchHotkey, () => this.palette.changeActionType(ActionType.Tags)),
        ];
    }

    getInstructions(): Instruction[] {
        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'Run command' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: this.plugin.settings.fileSearchHotkey }, this.plugin.settings), purpose: 'Search Files' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: this.plugin.settings.tagSearchHotkey }, this.plugin.settings), purpose: 'Search Tags' },
        ];
    }

    renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void {
        const command = this.app.commands.findCommand(match.id);
        const customHotkeys = this.app.hotkeyManager.getHotkeys(command.id);
        const defaultHotkeys = this.app.hotkeyManager.getDefaultHotkeys(command.id);

        // If hotkeys have been customized in some way (add new, deleted default)
        // customHotkeys will be an array, otherwise undefined
        // If there is a default hotkey defaultHotkeys will be an array
        // (does not check any customization), otherwise undefined.
        const hotkeys = customHotkeys || defaultHotkeys || [];

        if (this.getPinnedItems().find((i) => i.id === match.id)) {
            const flairContainer = aux.querySelector('.suggestion-flair') as HTMLElement;
            setIcon(flairContainer, 'filled-pin', 13);
            flairContainer.ariaLabel = 'Pinned';
            flairContainer.onClickEvent(() => {});
        }

        let { text } = match;
        let prefix = '';

        // Has a plugin name prefix
        if (text.includes(this.COMMAND_PLUGIN_NAME_SEPARATOR)) {
            // Wish there was an easy way to get the plugin name without string manipulation
            // Seems like this is how the acutal command palette does it though
            const split = text.split(this.COMMAND_PLUGIN_NAME_SEPARATOR);
            // Get first element
            prefix = split.shift()!;
            text = split.join(this.COMMAND_PLUGIN_NAME_SEPARATOR);
        }

        content.createEl('span', {
            cls: 'suggestion-title',
            text,
        });

        if (prefix && this.plugin.settings.showPluginName) {
            content.createEl('span', {
                cls: 'suggestion-note',
                text: prefix,
            });
        }

        hotkeys.forEach((hotkey) => {
            aux.createEl('kbd', {
                cls: 'suggestion-hotkey',
                text: generateHotKeyText(hotkey, this.plugin.settings),
            });
        });
    }

    async onChooseSuggestion(match: Match) {
        this.getPrevItems().add(match);
        this.app.commands.executeCommandById(match.id);
    }
}
