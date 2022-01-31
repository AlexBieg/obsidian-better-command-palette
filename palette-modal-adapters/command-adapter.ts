import { App, Command, setIcon } from "obsidian";
import { Match} from "types";
import { generateHotKeyText, PaletteMatch, SuggestModalAdapter, UnsafeAppInterface } from "utils";

export class BetterCommandPaletteCommandAdapter extends SuggestModalAdapter {
    COMMAND_PLUGIN_NAME_SEPARATOR: string = ': ';

    // Unsafe Interfaces
    app: UnsafeAppInterface;

    allItems: Match[];
    pinnedItems: Match[];

    initialize() {
        super.initialize();

        this.allItems = this.app.commands.listCommands()
            .sort((a: Command, b: Command) => b.name.localeCompare(a.name))
            .map((c: Command): Match => new PaletteMatch(c.id, c.name));

        const pinnedCommands = this.app.internalPlugins.getPluginById('command-palette').instance.options.pinned || [];
        this.pinnedItems = pinnedCommands.map(
            (id: string): Match => new PaletteMatch(id, this.app.commands.findCommand(id).name)
        );
    }

    getTitleText(): string {
        return 'Better Command Palette: Commands';
    }

    getEmptyStateText(): string {
        return 'No matching commands.';
    }

    renderSuggestion(match: Match, el: HTMLElement): void {
        const command = this.app.commands.findCommand(match.id);
        const customHotkeys = this.app.hotkeyManager.getHotkeys(command.id);
        const defaultHotkeys = this.app.hotkeyManager.getDefaultHotkeys(command.id);

        // If hotkeys have been customized in some way (add new, deleted default) customHotkeys will be an array, otherwise undefined
        // If there is a default hotkey defaultHotkeys will be an array (does not check any customization), otherwise undefined.
        const hotkeys = customHotkeys || defaultHotkeys || [];



        if (this.getPinnedItems().find(i => i.id === match.id)) {
            const flairContainer = el.createEl('span', 'suggestion-flair');
            // 13 copied from current command palette
            setIcon(flairContainer, 'filled-pin', 13);
        }

        let text = match.text;

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
            })
        }

        el.createEl('span', {
            cls: 'suggestion-content',
            text,
        });


        for (const hotkey of hotkeys) {
            el.createEl('kbd', {
                cls: 'suggestion-hotkey',
                text: generateHotKeyText(hotkey),
            })
        }
    }

    async onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent) {
        this.getPrevItems().add(match);
        this.app.commands.executeCommandById(match.id);
    };

}