import { Command, FuzzySuggestModal } from 'obsidian';
import { UnsafeAppInterface } from 'src/types/types';
import { getCommandText } from './utils';

export default class CommandSuggestModal extends FuzzySuggestModal<Command> {
    app: UnsafeAppInterface;

    callback: (item: Command) => void;

    getItemText = getCommandText;

    constructor(app: UnsafeAppInterface, callback: (item: Command) => void) {
        super(app);
        this.callback = callback;
    }

    getItems(): Command[] {
        return Object.values(this.app.commands.commands);
    }

    onChooseItem(item: Command): void {
        this.callback(item);
    }
}
