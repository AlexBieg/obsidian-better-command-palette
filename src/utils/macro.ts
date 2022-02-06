import {
    App, Command, Notice,
} from 'obsidian';
import { MacroCommandInterface, UnsafeAppInterface } from 'src/types/types';

export default class MacroCommand implements Command, MacroCommandInterface {
    app: UnsafeAppInterface;

    id: string;

    name: string;

    commandIds: string[];

    delay: number;

    constructor(
        app: App,
        id: string,
        name: string,
        commandIds: string[] = [],
        delay: number = 200,
    ) {
        this.app = app as UnsafeAppInterface;
        this.id = id;
        this.name = name;
        this.commandIds = commandIds;
        this.delay = delay;
    }

    addCommand(commandId: string) {
        this.commandIds.push(commandId);
    }

    removeCommand(commandId: string) {
        this.commandIds = this.commandIds.filter((c) => c === commandId);
    }

    commandIsAvailable(id:string) {
        const command = this.app.commands.findCommand(id);
        return !command.checkCallback || command.checkCallback(true);
    }

    async callAllCommands() {
        const notice = new Notice(`Running "${this.name}"...`, 10000);

        for (let i = 0; i < this.commandIds.length; i += 1) {
            const commandId = this.commandIds[i];
            const command = this.app.commands.findCommand(commandId);

            if (!this.commandIsAvailable(commandId)) {
                notice.setMessage(`Error: "${command.name}" cannot be used in this context. The macro is stopping.`);
                break;
            }

            notice.setMessage(`Running "${command.name}"`);

            this.app.commands.executeCommandById(commandId);

            // Give our commands some time to complete
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => {
                setTimeout(resolve, this.delay);
            });
        }

        notice.hide();
        // eslint-disable-next-line no-new
        new Notice(`Successfully ran "${this.name}"`);

        return true;
    }

    checkCallback(checking: boolean): boolean | void {
        if (checking) {
            return this.commandIsAvailable(this.commandIds[0]);
        }

        this.callAllCommands();
        return null;
    }
}
