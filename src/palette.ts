import { App, SuggestModal } from 'obsidian';
import {
    OrderedSet, PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeSuggestModalInterface } from 'src/types/types';
import {
    BetterCommandPaletteCommandAdapter,
    BetterCommandPaletteFileAdapter,
    BetterCommandPaletteTagAdapter,
} from 'src/palette-modal-adapters';
import BetterCommandPalettePlugin from 'src/main';

class BetterCommandPaletteModal extends SuggestModal<Match> implements UnsafeSuggestModalInterface {
    ACTION_TYPE_COMMAND = 1;

    ACTION_TYPE_FILES = 2;

    ACTION_TYPE_TAGS = 3;

    // Unsafe interface
    chooser: UnsafeSuggestModalInterface['chooser'];

    updateSuggestions: UnsafeSuggestModalInterface['updateSuggestions'];

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
        initialInputValue = '',
    ) {
        super(app);

        // General instance variables
        this.fileSearchPrefix = plugin.settings.fileSearchPrefix;
        this.tagSearchPrefix = plugin.settings.tagSearchPrefix;
        this.limit = plugin.settings.suggestionLimit;
        this.initialInputValue = initialInputValue;

        // The only time the input will be empty will be when we are searching commands
        this.setPlaceholder('Select a command');

        // Set up all of our different adapters
        this.commandAdapter = new BetterCommandPaletteCommandAdapter(
            app,
            prevCommands,
            plugin,
        );
        this.fileAdapter = new BetterCommandPaletteFileAdapter(
            app,
            prevFiles,
            plugin,
        );
        this.tagAdapter = new BetterCommandPaletteTagAdapter(
            app,
            prevTags,
            plugin,
        );

        // Lets us do the suggestion fuzzy search in a different thread
        this.suggestionsWorker = suggestionsWorker;
        this.suggestionsWorker.onmessage = (msg: MessageEvent) => this.receivedSuggestions(msg);

        // Add our custom title element
        this.modalTitleEl = createEl('p', {
            cls: 'better-command-palette-title',
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

            if (plugin.settings.closeWithBackspace && el.value === '') {
                this.close();
                // Stops the editor from using the backspace event
                event.preventDefault();
            }
        };

        this.scope.register([], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register(['Meta'], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register(['Meta'], 'Enter', (event: KeyboardEvent) => {
            if (this.actionType === this.ACTION_TYPE_FILES) {
                this.currentAdapter.onChooseSuggestion(null, event);
                this.close();
            }
        });
    }

    onOpen() {
        super.onOpen();

        // Add the initial value to the input
        // TODO: Figure out if there is a way to bypass the first seach
        // result flickering before this is set
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
            type = this.ACTION_TYPE_COMMAND;
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
        this.modalTitleEl.setText(this.currentAdapter.getTitleText());
    }

    updateEmptyStateText() {
        this.emptyStateText = this.currentAdapter.getEmptyStateText();
    }

    getItems(): Match[] {
        return this.currentAdapter.getSortedItems();
    }

    receivedSuggestions(msg : MessageEvent) {
        const results = msg.data.slice(0, this.limit);
        const matches = results.map((r : Record<string, string>) => new PaletteMatch(r.id, r.text));
        this.currentSuggestions = matches;
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
        const fixedQuery = this.currentAdapter.cleanQuery(query.trim());

        if (getNewSuggestions) {
            // Load suggestions in another thread
            this.getSuggestionsAsync(fixedQuery);
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
