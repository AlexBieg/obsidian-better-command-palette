import {
    App, Command, Modifier, PluginSettingTab, setIcon, Setting,
} from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import { HotkeyStyleType, MacroCommandInterface, UnsafeAppInterface } from './types/types';
import { SettingsCommandSuggestModal } from './utils';

export interface BetterCommandPalettePluginSettings {
    closeWithBackspace: boolean,
    showPluginName: boolean,
    fileSearchPrefix: string,
    tagSearchPrefix: string,
    commandSearchHotkey: string,
    fileSearchHotkey: string,
    tagSearchHotkey: string,
    suggestionLimit: number,
    recentAbovePinned: boolean,
    hyperKeyOverride: boolean,
    macros: MacroCommandInterface[],
    hotkeyStyle: HotkeyStyleType;
    createNewFileMod: Modifier,
    openInNewTabMod: Modifier,
    hiddenCommands: string[],
    hiddenFiles: string[],
    hiddenTags: string[],
    fileTypeExclusion: string[],
}

export const DEFAULT_SETTINGS: BetterCommandPalettePluginSettings = {
    closeWithBackspace: true,
    showPluginName: true,
    fileSearchPrefix: '/',
    tagSearchPrefix: '#',
    commandSearchHotkey: 'p',
    fileSearchHotkey: 'o',
    tagSearchHotkey: 't',
    suggestionLimit: 50,
    recentAbovePinned: false,
    hyperKeyOverride: false,
    macros: [],
    hotkeyStyle: 'auto',
    createNewFileMod: 'Mod',
    openInNewTabMod: 'Shift',
    hiddenCommands: [],
    hiddenFiles: [],
    hiddenTags: [],
    fileTypeExclusion: [],
};

export class BetterCommandPaletteSettingTab extends PluginSettingTab {
    plugin: BetterCommandPalettePlugin;

    app: UnsafeAppInterface;

    constructor (app: App, plugin: BetterCommandPalettePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display (): void {
        this.containerEl.empty();
        this.displayBasicSettings();
        this.displayMacroSettings();
    }

    displayBasicSettings (): void {
        const { containerEl } = this;
        const { settings } = this.plugin;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Better Command Palette Settings' });
        new Setting(containerEl)
            .setName('Close on Backspace')
            .setDesc('Close the palette when there is no text and backspace is pressed')
            .addToggle((t) => t.setValue(settings.closeWithBackspace).onChange(async (val) => {
                settings.closeWithBackspace = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Show Plugin Name')
            .setDesc('Show the plugin name in the command palette')
            .addToggle((t) => t.setValue(settings.showPluginName).onChange(async (val) => {
                settings.showPluginName = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Recent above Pinned')
            .setDesc('Sorts the suggestion so that the recently used items show before pinned items.')
            .addToggle((t) => t.setValue(settings.recentAbovePinned).onChange(async (val) => {
                settings.recentAbovePinned = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Caps Lock Hyper Key Hotkey Override')
            .setDesc('For those users who have use a "Hyper Key", enabling this maps the icons "⌥ ^ ⌘ ⇧" to the caps lock icon "⇪" ')
            .addToggle((t) => t.setValue(settings.hyperKeyOverride).onChange(async (val) => {
                settings.hyperKeyOverride = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Use shift to create files and cmd/CTRL to open in new tab')
            .setDesc('By default cmd/ctrl is used to create files and shift is used to open in new tab. This setting reverses that to mimic the behavior of the standard quick switcher.')
            .addToggle((t) => t.setValue(settings.createNewFileMod === 'Shift').onChange(async (val) => {
                settings.createNewFileMod = val ? 'Shift' : 'Mod';
                settings.openInNewTabMod = val ? 'Mod' : 'Shift';
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('File Type Exclusions')
            .setDesc('A comma separated list of file extensions (ex: "pdf,jpg,png") that should not be shown when searching files.')
            .addText((t) => t.setValue(settings.fileTypeExclusion.join(',')).onChange(async (val) => {
                const list = val.split(',').map((e) => e.trim());
                settings.fileTypeExclusion = list;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('File Search Prefix')
            .setDesc('The prefix used to tell the palette you want to search files')
            .addText((t) => t.setValue(settings.fileSearchPrefix).onChange(async (val) => {
                settings.fileSearchPrefix = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Tag Search Prefix')
            .setDesc('The prefix used to tell the palette you want to search tags')
            .addText((t) => t.setValue(settings.tagSearchPrefix).onChange(async (val) => {
                settings.tagSearchPrefix = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Command Search Hotkey')
            .setDesc('The hotkey used to switch to command search while using the command palette.')
            .addText((t) => t.setValue(settings.commandSearchHotkey).onChange(async (val) => {
                settings.commandSearchHotkey = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('File Search Hotkey')
            .setDesc('The hotkey used to switch to file search while using the command palette.')
            .addText((t) => t.setValue(settings.fileSearchHotkey).onChange(async (val) => {
                settings.fileSearchHotkey = val;
                await this.plugin.saveSettings();
            }));

        new Setting(containerEl)
            .setName('Tag Search Hotkey')
            .setDesc('The hotkey used to switch to tag search while using the command palette.')
            .addText((t) => t.setValue(settings.tagSearchHotkey).onChange(async (val) => {
                settings.tagSearchHotkey = val;
                await this.plugin.saveSettings();
            }));

        const dropdownOptions = {
            10: '10',
            20: '20',
            50: '50',
            100: '100',
            200: '200',
            500: '500',
            1000: '1000',
        };
        new Setting(containerEl)
            .setName('Suggestion Limit')
            .setDesc('The number of items that will be in the suggestion list of the palette. Really high numbers can affect performance')
            .addDropdown((d) => d.addOptions(dropdownOptions)
                .setValue(settings.suggestionLimit.toString())
                .onChange(async (v) => {
                    settings.suggestionLimit = parseInt(v, 10);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Hotkey Modifier Style')
            .setDesc('Allows autodetecting of hotkey modifier or forcing to Mac or Windows')
            .addDropdown((d) => d.addOptions({
                auto: 'Auto Detect',
                mac: 'Force Mac Hotkeys',
                windows: 'Force Windows Hotkeys',
            }).setValue(settings.hotkeyStyle)
                .onChange(async (v) => {
                    settings.hotkeyStyle = v as HotkeyStyleType;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Add new macro')
            .setDesc('Create a new grouping of commands that can be run together')
            .addButton((button) => button
                .setButtonText('+')
                .onClick(async () => {
                    settings.macros.push({
                        name: `Macro ${settings.macros.length + 1}`,
                        commandIds: [],
                        delay: 200,
                    });
                    await this.plugin.saveSettings();
                    this.display();
                }));
    }

    displayMacroSettings (): void {
        const { containerEl } = this;
        const { settings } = this.plugin;

        settings.macros.forEach((macro, index) => {
            const topLevelSetting = new Setting(containerEl)
                .setClass('macro-setting')
                .setName(`Macro #${index + 1}`)
                .addButton((button) => button
                    .setButtonText('Delete Macro')
                    .onClick(async () => {
                        settings.macros.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            const mainSettingsEl = topLevelSetting.settingEl.createEl('div', 'macro-main-settings');

            mainSettingsEl.createEl('label', { text: 'Macro Name' });
            mainSettingsEl.createEl('input', {
                cls: 'name-input',
                type: 'text',
                value: macro.name,
            }).on('change', '.name-input', async (evt: Event) => {
                const target = evt.target as HTMLInputElement;
                settings.macros[index] = { ...macro, name: target.value };
                await this.plugin.saveSettings();
            });

            mainSettingsEl.createEl('label', { text: 'Delay (ms)' });
            mainSettingsEl.createEl('input', {
                cls: 'delay-input',
                type: 'number',
                value: macro.delay.toString(),
            }).on('change', '.delay-input', async (evt: Event) => {
                const target = evt.target as HTMLInputElement;
                const delayStr = target.value;
                settings.macros[index].delay = parseInt(delayStr, 10);
                await this.plugin.saveSettings();
            });

            mainSettingsEl.createEl('label', { text: 'Add a new Command to the macro' });
            mainSettingsEl.createEl('button', { text: 'Add Command' }).onClickEvent(async () => {
                const suggestModal = new SettingsCommandSuggestModal(
                    this.app,
                    async (item: Command) => {
                        settings.macros[index].commandIds.push(item.id);
                        await this.plugin.saveSettings();
                        this.display();
                    },
                );
                suggestModal.open();
            });

            macro.commandIds.forEach((id, cIndex) => {
                const command = this.app.commands.findCommand(id);
                const commandEl = topLevelSetting.settingEl.createEl('div', 'macro-command');

                const buttonEl = commandEl.createEl('button', `delete-command-${cIndex}`);

                commandEl.createEl('p', { text: `${cIndex + 1}: ${command.name}`, cls: 'command' });

                setIcon(buttonEl, 'trash');
                buttonEl.onClickEvent(async () => {
                    settings.macros[index].commandIds.splice(cIndex, 1);
                    await this.plugin.saveSettings();
                    this.display();
                });
            });
        });
    }
}
