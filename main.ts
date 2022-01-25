import { FuzzySuggestModal, Plugin, Command, App, FuzzyMatch, Modifier, Hotkey } from 'obsidian';

const MODIFIER_ICONS = {
	Mod: '⌘',
	Ctrl: '^',
	Meta: '⌘',
	Alt: '⌥',
	Shift: '⇧',
}

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

export default class MyPlugin extends Plugin {
	prevCommands : OrderedSet<Command>;

	async onload() {
		this.prevCommands = new OrderedSet<Command>()

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-better-commmand-palette',
			name: 'Open better command palette',
			hotkeys: [{ modifiers: ["Mod"], key: "p" }],
			callback: () => {
				new BetterCommandPaletteModal(this.app, this.prevCommands, this).open();
			}
		});
	}
}

function generateHotKeyText(hotkey : Hotkey) : string {
	var hotKeyStrings : string[] = [];
	for (const mod of hotkey.modifiers) {
		hotKeyStrings.push(MODIFIER_ICONS[mod])
	}

	hotKeyStrings.push(hotkey.key.toUpperCase())

	return hotKeyStrings.join(' ')
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
