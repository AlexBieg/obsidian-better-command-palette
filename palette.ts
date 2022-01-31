import { App, SuggestModal } from "obsidian";
import { OrderedSet, PaletteMatch, SuggestModalAdapter } from "./utils";
import {
    BetterCommandPaletteCommandAdapter,
    BetterCommandPaletteFileAdapter,
    BetterCommandPaletteTagAdapter,
} from "palette-modal-adapters";
import { Match } from './types';
import BetterCommandPalettePlugin from "main";

class BetterCommandPaletteModal extends SuggestModal <any> {
    ACTION_TYPE_COMMAND: number = 1;
    ACTION_TYPE_FILES: number = 2;
    ACTION_TYPE_TAGS: number = 3;

    actionType: number;
    fileSearchPrefix: string;
    tagSearchPrefix: string;
    suggestionsWorker: Worker;
    currentSuggestions: Match[];
    lastQuery: string;
    modalTitleEl: HTMLElement;
    initialInputValue: string;

    commandAdapter: BetterCommandPaletteCommandAdapter;
    fileAdapter: BetterCommandPaletteFileAdapter;
    tagAdapter: BetterCommandPaletteTagAdapter;
    currentAdapter: SuggestModalAdapter;

    constructor(
        app: App,
        prevCommands: OrderedSet<Match>,
        prevFiles: OrderedSet<Match>,
        prevTags: OrderedSet<Match>,
        plugin: BetterCommandPalettePlugin,
        suggestionsWorker: Worker,
        initialInputValue: string = '',
    ) {
        super(app);

        // General instance variables
        this.fileSearchPrefix = plugin.settings.fileSearchPrefix;
        this.tagSearchPrefix = plugin.settings.tagSearchPrefix;
        this.limit = plugin.settings.suggestionLimit;
        this.initialInputValue = initialInputValue;

        // The only time the input will be empty will be when we are searching commands
        this.setPlaceholder('Select a command')

        // Set up all of our different adapters
        this.commandAdapter = new BetterCommandPaletteCommandAdapter(
            app,
            prevCommands,
            plugin.settings.recentAbovePinned,
        );
        this.fileAdapter = new BetterCommandPaletteFileAdapter(
            app,
            prevFiles,
            plugin.settings.recentAbovePinned,
            this.fileSearchPrefix,
        );
        this.tagAdapter = new BetterCommandPaletteTagAdapter(
            app,
            prevTags,
            plugin.settings.recentAbovePinned,
            this.tagSearchPrefix,
        );

        // Lets us do the suggestion fuzzy search in a different thread
        this.suggestionsWorker = suggestionsWorker;
        this.suggestionsWorker.onmessage = (msg: MessageEvent) => this.receivedSuggestions(msg);

        // Add our custom title element
        this.modalTitleEl = createEl('p', {
            cls: 'better-command-palette-title'
        });

        // Update our action type before adding in our title element so the text is correct
        this.updateActionType();

        // Add in the title element
        this.modalEl.insertBefore(this.modalTitleEl, this.modalEl.firstChild);

        // Set our scopes for the modal
        this.setScopes(plugin);
    }

    setScopes(plugin: BetterCommandPalettePlugin) {
        const closeModal = (event: KeyboardEvent) => {
            // Have to cast this to access `value`
            const el = event.target as HTMLInputElement;

            if (plugin.settings.closeWithBackspace && el.value == '') {
                this.close()
                // Stops the editor from using the backspace event
                event.preventDefault();
            }
        }

        this.scope.register([], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register(['Meta'], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register(['Meta'], 'Enter', () => {
            if (this.actionType === this.ACTION_TYPE_FILES) {
                // @ts-ignore Until I know otherise I'll grab the currently chosen item from the `chooser`
                this.chooser.useSelectedItem({ metaKey: true });
            }
        });
    }

    onOpen() {
        super.onOpen();

        // Add the initial value to the input
        // TODO: Figure out if there is a way to bypass the first seach result flickering before this is set
        // As far as I can tell onOpen resets the value of the input so this is the first place
        if (this.initialInputValue) {
            this.inputEl.value = this.initialInputValue;
        }
    }

	updateActionType() : boolean {
        const text: string = this.inputEl.value;
        let type;

        if (text.startsWith(this.fileSearchPrefix)) {
            type = this.ACTION_TYPE_FILES;
            this.currentAdapter = this.fileAdapter;
        } else if (text.startsWith(this.tagSearchPrefix)) {
            type = this.ACTION_TYPE_TAGS;
            this.currentAdapter = this.tagAdapter;
        } else {
            type = this.ACTION_TYPE_COMMAND
            this.currentAdapter = this.commandAdapter;
        }

        if (!this.currentAdapter.initialized) {
            this.currentAdapter.initialize();
        }

        const wasUpdated = type !== this.actionType;
        this.actionType = type;

        if (wasUpdated) {
            this.updateEmptyStateText();
            this.updateTitleText();
            this.currentSuggestions = this.currentAdapter.getSortedItems();
        }

        return wasUpdated;
    }

    updateTitleText() {
        this.modalTitleEl.setText(this.currentAdapter.getTitleText())
    }

    updateEmptyStateText() {
        this.emptyStateText = this.currentAdapter.getEmptyStateText();
    }


	getItems(): Match[] {
        return this.currentAdapter.getSortedItems();
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
        // The action type might have changed
        this.updateActionType();

        const getNewSuggestions = query !== this.lastQuery;
        this.lastQuery = query;
        query = query.trim()
        query = this.currentAdapter.cleanQuery(query);

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

	renderSuggestion(match: Match, el: HTMLElement) {
        this.renderPrevItems(match, el, this.currentAdapter.getPrevItems());
        this.currentAdapter.renderSuggestion(match, el);
    }

	async onChooseSuggestion(item: Match, event: MouseEvent | KeyboardEvent) {
        this.currentAdapter.onChooseSuggestion(item, event);
    }
}

export default BetterCommandPaletteModal;