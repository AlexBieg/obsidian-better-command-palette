import { Command, FuzzySuggestModal } from 'obsidian';
import { UnsafeAppInterface } from 'src/types/types';

export default class CommandSuggestModal extends FuzzySuggestModal<Command> {
    app: UnsafeAppInterface;

    callback: (item: Command) => void;

    constructor(app: UnsafeAppInterface, callback: (item: Command) => void) {
        super(app);
        this.callback = callback;
    }

    getItems(): Command[] {
        return Object.values(this.app.commands.commands);
    }

    getItemText(item: Command): string {
        return item.name;
    }

    onChooseItem(item: Command): void {
        this.callback(item);
    }
}
