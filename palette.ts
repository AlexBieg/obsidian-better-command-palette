import BetterCommandPalettePlugin from "main";
import { App, Command, FuzzyMatch, FuzzySuggestModal, Hotkey, normalizePath, TFile } from "obsidian";
import { generateHotKeyText, OrderedSet } from "utils";

class BetterCommandPaletteModal extends FuzzySuggestModal < any > {
    ACTION_TYPE_COMMAND: string = 'command';
    ACTION_TYPE_FILES: string = 'files';

    actionType: string;
    prevCommands: OrderedSet<Command>;
    prevFiles: OrderedSet<TFile>;
    fileSearchPrefix: string;

    constructor(app: App, prevCommands: OrderedSet<Command>, prevFiles: OrderedSet<TFile>, plugin: BetterCommandPalettePlugin) {
        super(app);
        this.prevCommands = prevCommands;
        this.prevFiles = prevFiles;
        this.actionType = this.getActionType();
        this.fileSearchPrefix = plugin.settings.fileSearchPrefix;
        this.limit = plugin.settings.suggestionLimit;

        this.setPlaceholder('Select a command')
        this.updateEmptyStateText()

        const modalTitle = createEl('p', {
            text: 'Better Command Palette',
            cls: 'better-command-palette-title'
        });

        this.modalEl.insertBefore(modalTitle, this.modalEl.firstChild);

        plugin.registerDomEvent(this.inputEl, 'keydown', (event) => {
            // Let's us close the modal if there is no value and the user presses backspace
            // @ts-ignore Event target's definitely have a `value`. Maybe I'm missing something about TS
            if (plugin.settings.closeWithBackspace && event.key === 'Backspace' && event.target.value == '') {
                this.close()
            }

            // Use item even if meta is held
            if (this.actionType === this.ACTION_TYPE_FILES && event.key === 'Enter' && event.metaKey) {
                // Seems like there should be a better way to do this
                // @ts-ignore Until I know otherise I'll grab the currently chosen item from the `chooser`
                const selectedItem = this.chooser.values && this.chooser.values[this.chooser.selectedItem]
                this.onChooseItem(selectedItem && selectedItem.item, event)
                this.close();
            }
        });

        plugin.registerDomEvent(this.inputEl, 'keyup', (event) => {
            const potentialNewType = this.getActionType();
            // Action Type changed
            if (potentialNewType !== this.actionType) {
                this.actionType = potentialNewType;
                this.updateEmptyStateText()
                //@ts-ignore Need this to update the suggestions without needing to type another character
                this.updateSuggestions();
            }
        });
    }

	getActionType(): string {
        const text: string = this.inputEl.value;

        if (text.startsWith(this.fileSearchPrefix)) {
            return this.ACTION_TYPE_FILES;
        }

        return this.ACTION_TYPE_COMMAND
    }

    updateEmptyStateText() {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                this.emptyStateText = 'No matching files. ⌘+Enter to create the file.'
                break;

            case this.ACTION_TYPE_COMMAND:
                this.emptyStateText = 'No matching commands.'
                break;
        }
    }

	getSortedItems(items: any[], prevItems: OrderedSet<any>) {
        const allItems = new OrderedSet(items);

        for (const prevItem of prevItems.values()) {
            if (allItems.has(prevItem)) {
                // Bring it to the top
                allItems.add(prevItem);
            }
        }

        return allItems.valuesByLastAdd();
    }

	getItems(): Array<any> {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                return this.getSortedItems(
                    this.app.vault.getMarkdownFiles(),
                    this.prevFiles,
                )

            case this.ACTION_TYPE_COMMAND:
                return this.getSortedItems(
                    // @ts-ignore Can't find another way to access commands. Seems like other plugins have used this.
                    this.app.commands.listCommands().sort((a: Command, b: Command) => b.name.localeCompare(a.name)),
                    this.prevCommands,
                );
        }
    }

	getSuggestions(query: string): FuzzyMatch<any>[] {
        query = query.trim()
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                query = query.replace(this.fileSearchPrefix, '')
                break;

            case this.ACTION_TYPE_COMMAND:
                break;
        }

        return super.getSuggestions(query);

    }

	getItemText(item: any) {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                return item.path;

            case this.ACTION_TYPE_COMMAND:
                return item.name;
        }
    }

	renderPrevItems(match: FuzzyMatch<any>, el: HTMLElement, prevItems: OrderedSet<any>) {
        if (prevItems.has(match.item)) {
            el.addClass('recent');
            el.createEl('span', {
                cls: 'recent-text',
                text: '(recently used)',
            });
        }
    }

	renderCommandSuggestion(match: FuzzyMatch<Command>, el: HTMLElement) {
        const command = match.item;
        const allHotkeys : Hotkey[] = [
            ...(command.hotkeys || []),
            // @ts-ignore Need to access hotkeyManager to get custom hotkeys
            ...(this.app.hotkeyManager.customKeys[command.id] || [])
        ]

        for (const hotkey of allHotkeys) {
            el.createEl('kbd', {
                cls: 'suggestion-hotkey',
                text: generateHotKeyText(hotkey),
            })
        }
    }

	renderSuggestion(match: FuzzyMatch<any>, el: HTMLElement) {
        super.renderSuggestion(match, el)

        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                this.renderPrevItems(match, el, this.prevFiles)
                break;

            case this.ACTION_TYPE_COMMAND:
                this.renderPrevItems(match, el, this.prevCommands)
                this.renderCommandSuggestion(match, el);
                break;
        }
    }



	async onChooseItem(item: any, event: MouseEvent | KeyboardEvent) {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                let created = false;
                if (!item) {
                    created = true;
                    // @ts-ignore Event target's definitely have a `value`. Maybe I'm missing something about TS
                    const path = normalizePath(`${event.target.value.replace(this.fileSearchPrefix, '')}.md`);
                    item = await this.app.vault.create(path, '');
                }

                this.prevFiles.add(item);
                const workspace = this.app.workspace;
                if (event.metaKey && !created) {
                    const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf)
                    newLeaf.openFile(item);
                    workspace.setActiveLeaf(newLeaf);
                } else {
                    workspace.activeLeaf.openFile(item);
                }

                break;

            case this.ACTION_TYPE_COMMAND:
                this.prevCommands.add(item);
                // @ts-ignore Can't find another way to access commands. Seems like other plugins have used this.
                this.app.commands.executeCommandById(item.id);
                break;
        }

    }
}

export default BetterCommandPaletteModal;