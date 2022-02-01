import { App, PluginSettingTab, Setting } from 'obsidian';
import BetterCommandPalettePlugin from './main';

export default class BetterCommandPaletteSettingTab extends PluginSettingTab {
    plugin: BetterCommandPalettePlugin;

    constructor(app: App, plugin: BetterCommandPalettePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
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
            .setName('Recent above Pinned')
            .setDesc('Sorts the suggestion so that the recently used items show before pinned items.')
            .addToggle((t) => t.setValue(settings.recentAbovePinned).onChange(async (val) => {
                settings.recentAbovePinned = val;
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
    }
}
