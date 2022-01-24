import { FuzzySuggestModal, Plugin, Command, App } from 'obsidian';


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
			id: 'toggle-better-commmand-palette',
			name: 'Toggle better command palette',
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "p" }],
			callback: () => {
				new BetterCommandPaletteModal(this.app, this.prevCommands, this).open();
			}
		});
	}

	onunload() {

	}
}

class BetterCommandPaletteModal extends FuzzySuggestModal<Command> {
	prevCommands : OrderedSet<Command>;
	constructor(app: App, prevCommands: OrderedSet<Command>, plugin: Plugin) {
		super(app);
		this.prevCommands = prevCommands;


		plugin.registerDomEvent(this.inputEl, 'keydown', (event) => {
			if (event.key === 'Backspace' && event.target.value == '') {
				this.close()
			}
		});
	}

	getItems() : Command[] {
		const allAvailableComands = new OrderedSet<Command>(this.app.commands.listCommands())

		for (const command of this.prevCommands.values()) {
			if (allAvailableComands.has(command)) {
				// Bring it to the top
				allAvailableComands.add(command);
			}
		}

		return allAvailableComands.valuesByLastAdd();
	}

	getItemText(item : Command) {
		return item.name;
	}

	onChooseItem(item : Command) {
		this.prevCommands.add(item);
		this.app.commands.executeCommandById(item.id);
	}
}
