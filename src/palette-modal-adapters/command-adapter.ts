import { Command, Instruction, setIcon } from 'obsidian';
import {
    generateHotKeyText, PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';

export default class BetterCommandPaletteCommandAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    COMMAND_PLUGIN_NAME_SEPARATOR = ': ';

    // Unsafe Interfaces
    app: UnsafeAppInterface;

    allItems: Match[];

    pinnedItems: Match[];

    initialize() {
        super.initialize();

        this.titleText = 'Better Command Palette: Commands';
        this.emptyStateText = 'No matching commands.';

        this.allItems = this.app.commands.listCommands()
            .sort((a: Command, b: Command) => b.name.localeCompare(a.name))
            .map((c: Command): Match => new PaletteMatch(c.id, c.name));

        const pinnedCommands = this.app.internalPlugins.getPluginById('command-palette').instance.options.pinned || [];
        this.pinnedItems = pinnedCommands.reverse().reduce(
            (acc: Match[], id: string): Match[] => {
                const command = this.app.commands.findCommand(id);

                // If a command was pinned and then the plugin removed we won't have a command here
                if (command) {
                    acc.push(new PaletteMatch(id, command.name));
                }

                return acc;
            },
            [],
        );
    }

    getInstructions(): Instruction[] {
        const backspaceHotkeyText = generateHotKeyText({ modifiers: [], key: 'BACKSPACE' }, this.plugin.settings);
        const escapeHotkeyText = generateHotKeyText({ modifiers: [], key: 'ESC' }, this.plugin.settings);

        return [
            { command: generateHotKeyText({ modifiers: [], key: 'ENTER' }, this.plugin.settings), purpose: 'Run command' },
            { command: `${backspaceHotkeyText} / ${escapeHotkeyText}`, purpose: 'Close palette' },
        ];
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        const command = this.app.commands.findCommand(match.id);
        const customHotkeys = this.app.hotkeyManager.getHotkeys(command.id);
        const defaultHotkeys = this.app.hotkeyManager.getDefaultHotkeys(command.id);

        // If hotkeys have been customized in some way (add new, deleted default)
        // customHotkeys will be an array, otherwise undefined
        // If there is a default hotkey defaultHotkeys will be an array
        // (does not check any customization), otherwise undefined.
        const hotkeys = customHotkeys || defaultHotkeys || [];

        if (this.getPinnedItems().find((i) => i.id === match.id)) {
            const flairContainer = el.createEl('span', 'suggestion-flair');
            // 13 copied from current command palette
            setIcon(flairContainer, 'filled-pin', 13);
        }

        let { text } = match;

        // Has a plugin name prefix
        if (text.includes(this.COMMAND_PLUGIN_NAME_SEPARATOR)) {
            // Wish there was an easy way to get the plugin name without string manipulation
            // Seems like this is how the acutal command palette does it though
            const split = text.split(this.COMMAND_PLUGIN_NAME_SEPARATOR);
            // Get first element
            const prefix = split.shift();
            text = split.join(this.COMMAND_PLUGIN_NAME_SEPARATOR);

            el.createEl('span', {
                cls: 'suggestion-prefix',
                text: prefix,
            });
        }

        el.createEl('span', {
            cls: 'suggestion-content',
            text,
        });

        hotkeys.forEach((hotkey) => {
            el.createEl('kbd', {
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
