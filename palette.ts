// import BetterCommandPalettePlugin from "./main";
import { App, Command, SuggestModal, Hotkey, normalizePath, setIcon } from "obsidian";
import { generateHotKeyText, OrderedSet, PaletteMatch } from "./utils";
import { Match } from './types';

class BetterCommandPaletteModal extends SuggestModal <any> {
    ACTION_TYPE_COMMAND: number = 1;
    ACTION_TYPE_FILES: number = 2;
    ACTION_TYPE_TAGS: number = 3;

    COMMAND_PLUGIN_NAME_SEPARATOR: string = ': ';

    actionType: number;
    prevCommands: OrderedSet<Match>;
    prevFiles: OrderedSet<Match>;
    fileSearchPrefix: string;
    tagSearchPrefix: string;
    recentAbovePinned: boolean;
    suggestionsWorker: Worker;
    currentSuggestions: Match[];
    lastQuery: string;

    constructor(app: App, prevCommands: OrderedSet<Match>, prevFiles: OrderedSet<Match>, plugin: any, suggestionsWorker: Worker) {
        super(app);
        this.prevCommands = prevCommands;
        this.prevFiles = prevFiles;
        this.fileSearchPrefix = plugin.settings.fileSearchPrefix;
        this.tagSearchPrefix = plugin.settings.tagSearchPrefix;
        this.limit = plugin.settings.suggestionLimit;
        this.recentAbovePinned = plugin.settings.recentAbovePinned;
        this.currentSuggestions = [];

        // Lets us do the suggestion fuzzy search in a different thread
        this.suggestionsWorker = suggestionsWorker;
        this.suggestionsWorker.onmessage = (msg: MessageEvent) => this.receivedSuggestions(msg);


        this.updateActionType();
        this.setPlaceholder('Select a command')
        this.updateEmptyStateText()

        const modalTitle = createEl('p', {
            text: 'Better Command Palette',
            cls: 'better-command-palette-title'
        });

        this.modalEl.insertBefore(modalTitle, this.modalEl.firstChild);

        plugin.registerDomEvent(this.inputEl, 'keydown', (event:KeyboardEvent) => {
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
                this.onChooseSuggestion(selectedItem && selectedItem.item, event)
                this.close();
            }
        });
    }

	updateActionType() : boolean {
        const text: string = this.inputEl.value;
        let type = this.ACTION_TYPE_COMMAND

        if (text.startsWith(this.fileSearchPrefix)) {
            type = this.ACTION_TYPE_FILES;
        }

        const wasUpdated = type !== this.actionType;
        this.actionType = type;
        return wasUpdated;
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

	getSortedItems(items: Match[], prevItems: OrderedSet<Match>) {
        const allItems = new OrderedSet(items);

        // TODO: Clean up this logic. If we ever have more than two things this will not work.
        const firstItems = this.recentAbovePinned ? prevItems.values() : this.getPinnedItems();
        const secondItems = !this.recentAbovePinned ? prevItems.values() : this.getPinnedItems();

        const itemsToAdd = [secondItems, firstItems];

        for (const toAdd of itemsToAdd) {
            for (const i of toAdd) {
                if (allItems.has(i)) {
                    // Bring it to the top
                    allItems.add(i);
                }
            }
        }

        return allItems.valuesByLastAdd();
    }

    getPinnedItems() : Match[] {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                return [];

            case this.ACTION_TYPE_COMMAND:
            default:
                // @ts-ignore Don't love accessing the internal plugin, but that's where it's stored
                return this.app.internalPlugins.getPluginById('command-palette').instance.options.pinned.map(
                    // @ts-ignore Get the command object using the command id
                    (id : string ) : Match => new PaletteMatch(id, this.app.commands.findCommand(id).name)
                );
        }
    }

	getItems(): Match[] {
        // @ts-ignore
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                return this.getSortedItems(
                    // @ts-ignore To support searching every file 'getCachedFiles' is much faster
                    this.app.metadataCache.getCachedFiles()
                        .reverse() // Reversed because we want it sorted A -> Z
                        .map((path : string) => new PaletteMatch(path, path)),
                    this.prevFiles,
                )

            case this.ACTION_TYPE_COMMAND:
            default:
                return this.getSortedItems(
                    // @ts-ignore Can't find another way to access commands. Seems like other plugins have used this.
                    this.app.commands.listCommands()
                        .sort((a: Command, b: Command) => b.name.localeCompare(a.name))
                        .map((c : Command) : Match => new PaletteMatch(c.id, c.name)),
                    this.prevCommands,
                )
        }
    }

    receivedSuggestions(msg : MessageEvent) {
        const results = msg.data.slice(0, this.limit)
        const matches = results.map((r : Record<string, string>) => new PaletteMatch(r.id, r.text))
        this.currentSuggestions = matches;
        // @ts-ignore
        this.updateSuggestions();
    }

    getSuggestionsAsync(query: string) {
        const items = this.getItems();
        this.suggestionsWorker.postMessage({
            query,
            items,
        });
    }

	getSuggestions(query: string): Match[] {
        const getNewSuggestions = query !== this.lastQuery;
        this.lastQuery = query;
        query = query.trim()
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                query = query.replace(this.fileSearchPrefix, '')
                break;

            case this.ACTION_TYPE_COMMAND:
                break;
        }

        // The action type might have changed
        if (this.updateActionType()) {
            // The action type did change, so update empty state text, and clear the current suggestions
            this.updateEmptyStateText();
            this.currentSuggestions = [];
        }

        if (getNewSuggestions) {
            // Load suggestions in another thread
            this.getSuggestionsAsync(query);
        }

        // For now return what we currently have. We'll populate results later if we need to
        return this.currentSuggestions;
    }

	renderPrevItems(match: Match, el: HTMLElement, prevItems: OrderedSet<Match>) {
        if (prevItems.has(match)) {
            el.addClass('recent');
            el.createEl('span', {
                cls: 'recent-text',
                text: '(recently used)',
            });
        }
    }

	renderCommandSuggestion(match: Match, el: HTMLElement) {
        // @ts-ignore
        const command = this.app.commands.findCommand(match.id);
        const allHotkeys : Hotkey[] = [
            ...(command.hotkeys || []),
            // @ts-ignore Need to access hotkeyManager to get custom hotkeys
            ...(this.app.hotkeyManager.customKeys[command.id] || [])
        ]

        if (this.getPinnedItems().find(i => i.id === match.id)) {
            const flairContainer = el.createEl('span', 'suggestion-flair');
            // 13 copied from current command palette
            setIcon(flairContainer, 'filled-pin', 13);
        }

        let text = match.text;

        // Has a plugin name prefix
        if (text.includes(this.COMMAND_PLUGIN_NAME_SEPARATOR)) {
            // Wish there was an easy way to get the plugin name without string manipulation
            // Seems like this is how the acutal command palette does it though
            const split = text.split(this.COMMAND_PLUGIN_NAME_SEPARATOR);
            const prefix = split[0];
            text = split[1];

            el.createEl('span', {
                cls: 'suggestion-prefix',
                text: prefix,
            })
            this.renderText({ ...match, text: text }, el);
        } else {
            this.renderText(match, el);
        }


        for (const hotkey of allHotkeys) {
            el.createEl('kbd', {
                cls: 'suggestion-hotkey',
                text: generateHotKeyText(hotkey),
            })
        }
    }

    renderText(match: Match, el: HTMLElement) {
        el.createEl('span', {
            cls: 'suggestion-content',
            text: match.text,
        })
    }

	renderSuggestion(match: Match, el: HTMLElement) {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                this.renderText(match, el)
                this.renderPrevItems(match, el, this.prevFiles)
                break;

            case this.ACTION_TYPE_COMMAND:
                this.renderCommandSuggestion(match, el);
                this.renderPrevItems(match, el, this.prevCommands)
                break;
        }
    }

	async onChooseSuggestion(item: Match, event: MouseEvent | KeyboardEvent) {
        switch (this.actionType) {
            case this.ACTION_TYPE_FILES:
                let created = false;
                let file = null;

                if (!item) {
                    created = true;
                    // @ts-ignore Event target's definitely have a `value`. Maybe I'm missing something about TS
                    const path = normalizePath(`${event.target.value.replace(this.fileSearchPrefix, '')}.md`);
                    file = await this.app.vault.create(path, '');
                    item = new PaletteMatch(file.path, file.path);
                } else {
                    file = this.app.metadataCache.getFirstLinkpathDest(item.id, '');
                }

                this.prevFiles.add(item);
                const workspace = this.app.workspace;

                if (event.metaKey && !created) {
                    const newLeaf = workspace.createLeafBySplit(workspace.activeLeaf)
                    newLeaf.openFile(file);
                    workspace.setActiveLeaf(newLeaf);
                } else {
                    workspace.activeLeaf.openFile(file);
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