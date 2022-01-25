import { FuzzySuggestModal, Plugin, Command, App, FuzzyMatch, Hotkey, PluginSettingTab, Setting } from 'obsidian';

const MODIFIER_ICONS = {
	Mod: '⌘',
	Ctrl: '^',
	Meta: '⌘',
	Alt: '⌥',
	Shift: '⇧',
}

/**
 * A utility set that keeps track of the last time an item was added to the
 * set even it it was already in the set.
 */
class OrderedSet<T> extends Set<T> {
	add(item: T) {
		if (this.has(item)) {
			this.delete(item);
		}

		return super.add(item);
	}

	valuesByLastAdd() : T[] {
		return Array.from(this).reverse()
	}
}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param hotkey Hotkey: The hotkey to generate text for
 * @returns string: The hotkey text
 */
function generateHotKeyText(hotkey: Hotkey): string {
	var hotKeyStrings: string[] = [];
	for (const mod of hotkey.modifiers) {
		hotKeyStrings.push(MODIFIER_ICONS[mod])
	}

	hotKeyStrings.push(hotkey.key.toUpperCase())

	return hotKeyStrings.join(' ')
}

class Macro extends Object {
	name : string;
	commands : Command[]
	constructor(name : string, commands : Command[]) {
		super()
		this.name = name;
		this.commands = commands;
	}
}

interface BetterCommandPalettePluginSettings {
	macros: Macro[],
}

const DEFAULT_SETTINGS: BetterCommandPalettePluginSettings = {
	macros: [],
}

export default class BetterCommandPalettePlugin extends Plugin {
	settings: BetterCommandPalettePluginSettings;
	prevCommands : OrderedSet<Command>;

	async onload() {
		await this.loadSettings();

		this.prevCommands = new OrderedSet<Command>()

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-better-commmand-palette',
			name: 'Open better command palette',
			// Generally I would not set a hotkey, but since it is a command palette I think it makes sense
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "p" }],
			callback: () => {
				new BetterCommandPaletteModal(this.app, this.prevCommands, this).open();
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



class BetterCommandPaletteModal extends FuzzySuggestModal<Command> {
	prevCommands : OrderedSet<Command>;

	constructor(app: App, prevCommands: OrderedSet<Command>, plugin: Plugin) {
		super(app);
		this.prevCommands = prevCommands;

		this.setPlaceholder('Select a command (or hit backspace to close)')

		plugin.registerDomEvent(this.inputEl, 'keydown', (event) => {
			if (event.key === 'Backspace' && event.target.value == '') {
				this.close()
			}
		});
	}

	getItems() : Command[] {
		const allAvailableCommands = new OrderedSet<Command>(
			this.app.commands.listCommands().sort((a : Command, b : Command) => b.name.localeCompare(a.name))
		);

		for (const command of this.prevCommands.values()) {
			if (allAvailableCommands.has(command)) {
				// Bring it to the top
				allAvailableCommands.add(command);
			}
		}

		return allAvailableCommands.valuesByLastAdd();
	}

	getItemText(item : Command) {
		return item.name;
	}

	renderSuggestion(match : FuzzyMatch<Command>, el : HTMLElement) {
		super.renderSuggestion(match, el)

		const command = match.item;

		if (match.item.hotkeys) {
			for (const hotkey of command.hotkeys) {
				el.createEl('kbd', {
					cls: 'suggestion-hotkey',
					text: generateHotKeyText(hotkey),
				})
			}
		}

		if (this.prevCommands.has(command)) {
			el.addClass('recent-command');
			el.createEl('span', {
				cls: 'recent-text',
				text: '(recently used)',
			});
		}
	}

	onChooseItem(item : Command) {
		this.prevCommands.add(item);
		this.app.commands.executeCommandById(item.id);
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
			.setName('Create a new Macro')
			.addButton((button) => {
				button.setButtonText('+')
					.onClick(async () => {
						settings.macros.push(new Macro(null, []));
						await this.plugin.saveSettings()
						this.display()
					})
			})
		containerEl.createEl('hr');

		containerEl.createEl('h3', { text: 'Your Macros' });
		for (let i = 0; i < settings.macros.length; i++) {
			const macro = settings.macros[i]
			containerEl.createEl('h4', { text: `Macro #${i + 1}` });

			new Setting(containerEl)
				.setName('Macro Name')
				.addText((text => text
					.setPlaceholder('Macro Name')
					.setValue(macro.name)
					.onChange(async (name) => {
						macro.name = name;
						await this.plugin.saveSettings()
					})))

			new Setting(containerEl)
				.setName('Add a new command')
				.addDropdown((dd) => dd.addOptions(this.app.commands.listCommands().reduce((acc, com)=> {
					acc[com.id] = com.name;
					return acc;
				}, {})))
				.addButton(button => button.setButtonText('add'))

			const commandList = containerEl.createEl('ol');
			for (const command of macro.commands) {
				commandList.createEl('li', { text: command.name })
			}
		}
	}
}
