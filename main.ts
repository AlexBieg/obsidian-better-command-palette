import { Plugin, Command, App, PluginSettingTab, Setting, TFile } from 'obsidian';

import { OrderedSet } from './utils';
import BetterCommandPaletteModal from './palette';


interface BetterCommandPalettePluginSettings {
	closeWithBackspace: boolean,
	fileSearchPrefix: string,
	suggestionLimit: number,
}

const DEFAULT_SETTINGS: BetterCommandPalettePluginSettings = {
	closeWithBackspace: true,
	fileSearchPrefix: '/',
	suggestionLimit: 50,
}

export default class BetterCommandPalettePlugin extends Plugin {
	settings: BetterCommandPalettePluginSettings;
	prevCommands : OrderedSet<Command>;
	prevFiles : OrderedSet<TFile>;

	async onload() {
		console.log('Loading plugin: Better Command Palette');

		await this.loadSettings();

		this.prevCommands = new OrderedSet<Command>()
		this.prevFiles = new OrderedSet<TFile>()

		this.addCommand({
			id: 'open-better-commmand-palette',
			name: 'Open better command palette',
			// Generally I would not set a hotkey, but since it is a command palette I think it makes sense
			// Can still be overwritten in the hotkey settings
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "p" }],
			callback: () => {
				new BetterCommandPaletteModal(this.app, this.prevCommands, this.prevFiles, this).open();
			}
		});

		this.addSettingTab(new BetterCommandPaletteSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BetterCommandPaletteSettingTab extends PluginSettingTab {
	plugin: BetterCommandPalettePlugin;

	constructor(app: App, plugin: BetterCommandPalettePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Better Command Palette Settings' });
		new Setting(containerEl)
			.setName('Close on Backspace')
			.setDesc('Close the palette when there is no text and backspace is pressed')
			.addToggle(t => t.setValue(settings.closeWithBackspace).onChange(async val => {
				settings.closeWithBackspace = val;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
			.setName('File Search Prefix')
			.setDesc('The prefix used to tell the palette you want to search files')
			.addText(t => t.setValue(settings.fileSearchPrefix).onChange(async val => {
				settings.fileSearchPrefix = val;
				await this.plugin.saveSettings();
			}));

		const dropdownOptions = {
			'10': '10',
			'20': '20',
			'50': '50',
			'100': '100',
			'200': '200',
			'500': '500',
			'1000': '1000',
		}
		new Setting(containerEl)
			.setName('Suggestion Limit')
			.setDesc('The number of items that will be in the suggestion list of the palette. Really high numbers can affect performance')
			.addDropdown(d => d.addOptions(dropdownOptions)
				.setValue(settings.suggestionLimit.toString())
				.onChange(async v => {
					settings.suggestionLimit = parseInt(v);
					await this.plugin.saveSettings();
				}));
	}
}
