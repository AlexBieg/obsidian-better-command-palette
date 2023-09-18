import {
    App, ButtonComponent, Modifier, Notice, Platform, setIcon, Setting, SuggestModal,
} from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import {
    BetterCommandPaletteCommandAdapter,
    BetterCommandPaletteFileAdapter,
    BetterCommandPaletteHotkeyAdapter,
    BetterCommandPaletteTagAdapter,
} from 'src/palette-modal-adapters';
import { Match, UnsafeAppInterface, UnsafeSuggestModalInterface } from 'src/types/types';
import {
    generateHotKeyText,
    OrderedSet, PaletteMatch, renderPrevItems, SuggestModalAdapter,
} from 'src/utils';
import { ActionType, BASIC_MODIFIER_NAMES, MAC_MODIFIER_ICONS } from './utils/constants';

type ActiveMods = Record<Modifier, boolean>;

class BetterCommandPaletteModal extends SuggestModal<Match> implements UnsafeSuggestModalInterface {
    // Unsafe interfaces

    declare chooser: UnsafeSuggestModalInterface['chooser'];

    declare app: UnsafeAppInterface;

    declare updateSuggestions: UnsafeSuggestModalInterface['updateSuggestions'];

    plugin: BetterCommandPalettePlugin;

    actionType!: ActionType;

    fileSearchPrefix: string;

    tagSearchPrefix: string;

    suggestionsWorker: Worker;

    currentSuggestions!: Match[];

    lastQuery!: string;

    modalTitleEl: HTMLElement;

    hiddenItemsHeaderEl: HTMLElement;

    showHiddenItems: boolean;

    initialInputValue: string;

    commandAdapter: BetterCommandPaletteCommandAdapter;

    fileAdapter: BetterCommandPaletteFileAdapter;

    tagAdapter: BetterCommandPaletteTagAdapter;

    hotkeyAdapter: BetterCommandPaletteHotkeyAdapter;

    currentAdapter!: SuggestModalAdapter;

    suggestionLimit: number;

    readonly activeMods: ActiveMods = {
        Mod: false,
        Alt: false,
        Shift: false,
        Ctrl: false,
        Meta: false,
    };

    modButton: ButtonComponent;

    altButton: ButtonComponent;

    modAltButton: ButtonComponent;

    shiftButton: ButtonComponent;

    constructor(
        app: App,
        prevCommands: OrderedSet<Match>,
        prevTags: OrderedSet<Match>,
        plugin: BetterCommandPalettePlugin,
        suggestionsWorker: Worker,
        initialInputValue = '',
    ) {
        super(app);

        // General instance variables
        this.fileSearchPrefix = plugin.settings.fileSearchPrefix;
        this.tagSearchPrefix = plugin.settings.tagSearchPrefix;
        this.suggestionLimit = plugin.settings.suggestionLimit;
        this.initialInputValue = initialInputValue;

        this.plugin = plugin;

        this.modalEl.addClass('better-command-palette');

        // Set up all of our different adapters
        this.commandAdapter = new BetterCommandPaletteCommandAdapter(
            app,
            prevCommands,
            plugin,
            this,
        );
        this.fileAdapter = new BetterCommandPaletteFileAdapter(
            app,
            new OrderedSet<Match>(),
            plugin,
            this,
        );
        this.tagAdapter = new BetterCommandPaletteTagAdapter(
            app,
            prevTags,
            plugin,
            this,
        );
        this.hotkeyAdapter = new BetterCommandPaletteHotkeyAdapter(
            app,
            prevTags,
            plugin,
            this,
        );

        // Lets us do the suggestion fuzzy search in a different thread
        this.suggestionsWorker = suggestionsWorker;
        this.suggestionsWorker.onmessage = (msg: MessageEvent) => this.receivedSuggestions(msg);

        const buttonBox = this.modalEl.createDiv({ cls: 'better-command-palette-buttons' });
        const modifiers = this.plugin.settings.hotkeyStyle === 'mac' ? MAC_MODIFIER_ICONS : BASIC_MODIFIER_NAMES;
        const allModsOff: Partial<ActiveMods> = { Mod: false, Alt: false };
        new Setting(buttonBox)
            .addButton((btn) => {
                this.modButton = btn;
                btn.buttonEl.setAttribute('tabindex', '-1');
                btn
                    .setButtonText(modifiers.Mod)
                    .onClick(() => {
                        this.updateMods(
                            this.activeMods.Mod && !this.activeMods.Alt
                                ? allModsOff
                                : { Mod: true, Alt: false },
                        );
                    });
            })
            .addButton((btn) => {
                this.altButton = btn;
                btn.buttonEl.setAttribute('tabindex', '-1');
                btn
                    .setButtonText(modifiers.Alt)
                    .onClick(() => {
                        this.updateMods(
                            !this.activeMods.Mod && this.activeMods.Alt
                                ? allModsOff
                                : { Mod: false, Alt: true },
                        );
                    });
            })
            .addButton((btn) => {
                this.modAltButton = btn;
                btn.buttonEl.setAttribute('tabindex', '-1');
                btn
                    .setButtonText(`${modifiers.Mod} + ${modifiers.Alt}`)
                    .onClick(() => {
                        this.updateMods(
                            this.activeMods.Mod && this.activeMods.Alt
                                ? allModsOff
                                : { Mod: true, Alt: true },
                        );
                    });
            })
            .addButton((btn) => {
                this.shiftButton = btn;
                btn.buttonEl.setAttribute('tabindex', '-1');
                btn
                    .setButtonText(modifiers.Shift)
                    .onClick(() => {
                        this.updateMods({ Shift: !this.activeMods.Shift });
                    });
            });
        this.modalEl.insertBefore(buttonBox, this.modalEl.firstChild);

        // Add our custom title element
        this.modalTitleEl = createEl('p', {
            cls: 'better-command-palette-title',
        });

        // Update our action type before adding in our title element so the text is correct
        this.updateActionType();

        // Add in the title element
        this.modalEl.insertBefore(this.modalTitleEl, this.modalEl.firstChild);

        this.hiddenItemsHeaderEl = createEl('p', 'hidden-items-header');
        this.showHiddenItems = false;

        this.hiddenItemsHeaderEl.onClickEvent(this.toggleHiddenItems);

        this.modalEl.insertBefore(this.hiddenItemsHeaderEl, this.resultContainerEl);

        // Set our scopes for the modal
        this.setScopes(plugin);
    }

    updateMods(update: Partial<ActiveMods>): void {
        Object.assign(this.activeMods, update);
        const setCtaIff = (condition: boolean, button: ButtonComponent) => {
            if (condition) {
                button.setCta();
            } else {
                button.removeCta();
            }
        };
        setCtaIff(this.activeMods.Mod && !this.activeMods.Alt, this.modButton);
        setCtaIff(!this.activeMods.Mod && this.activeMods.Alt, this.altButton);
        setCtaIff(this.activeMods.Mod && this.activeMods.Alt, this.modAltButton);
        setCtaIff(this.activeMods.Shift, this.shiftButton);

        if (this.expectingHotkey()) {
            this.setPlaceholder('Type a hotkey');
            this.setQuery('');
            this.inputEl.focus();
        } else {
            this.setPlaceholder('Select a command');
        }
        this.updateActionType();
    }

    expectingHotkey(): boolean {
        return this.activeMods.Mod || this.activeMods.Alt;
    }

    close(evt?: KeyboardEvent) {
        super.close();

        if (evt) {
            evt.preventDefault();
        }
    }

    setScopes(plugin: BetterCommandPalettePlugin) {
        const closeModal = (event: KeyboardEvent) => {
            // Have to cast this to access `value`
            const el = event.target as HTMLInputElement;

            if (plugin.settings.closeWithBackspace && el.value === '') {
                this.close(event);
            }
        };

        const { createNewPaneMod, createNewFileMod } = plugin.settings;

        this.scope.register([], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register(['Mod'], 'Backspace', (event: KeyboardEvent) => {
            closeModal(event);
        });

        this.scope.register([createNewFileMod], 'Enter', (event: KeyboardEvent) => {
            if (this.actionType === ActionType.Files) {
                this.currentAdapter.onChooseSuggestion(null, event);
                this.close(event);
            }
        });

        this.scope.register([createNewFileMod, createNewPaneMod], 'Enter', (event: KeyboardEvent) => {
            if (this.actionType === ActionType.Files) {
                this.currentAdapter.onChooseSuggestion(null, event);
                this.close(event);
            }
        });

        this.scope.register([createNewPaneMod], 'Enter', (event: KeyboardEvent) => {
            if (this.actionType === ActionType.Files && this.currentSuggestions.length) {
                this.currentAdapter.onChooseSuggestion(this.currentSuggestions[0], event);
                this.close(event);
            }
        });

        this.scope.register(['Mod'], 'I', this.toggleHiddenItems);
    }

    toggleHiddenItems = () => {
        this.showHiddenItems = !this.showHiddenItems;
        this.updateSuggestions();
    };

    onOpen() {
        super.onOpen();

        // Add the initial value to the input
        // TODO: Figure out if there is a way to bypass the first seach
        // result flickering before this is set
        // As far as I can tell onOpen resets the value of the input so this is the first place
        if (this.initialInputValue) {
            this.setQuery(this.initialInputValue);
        }
        this.updateMods({});
    }

    changeActionType(actionType:ActionType) {
        let prefix = '';
        if (actionType === ActionType.Files) {
            prefix = this.plugin.settings.fileSearchPrefix;
        } else if (actionType === ActionType.Tags) {
            prefix = this.plugin.settings.tagSearchPrefix;
        }
        const currentQuery: string = this.inputEl.value;
        const cleanQuery = this.currentAdapter.cleanQuery(currentQuery);

        this.inputEl.value = prefix + cleanQuery;
        this.updateSuggestions();
    }

    setQuery(
        newQuery: string,
        cursorPosition: number = -1,
    ) {
        this.inputEl.value = newQuery;

        if (cursorPosition > -1) {
            this.inputEl.setSelectionRange(cursorPosition, cursorPosition);
        }

        this.updateSuggestions();
    }

    updateActionType() : boolean {
        const text: string = this.inputEl.value;
        let nextAdapter;
        let type;

        if (this.expectingHotkey()) {
            type = ActionType.Hotkey;
            nextAdapter = this.hotkeyAdapter;
        } else if (text.startsWith(this.fileSearchPrefix)) {
            type = ActionType.Files;
            nextAdapter = this.fileAdapter;
        } else if (text.startsWith(this.tagSearchPrefix)) {
            type = ActionType.Tags;
            nextAdapter = this.tagAdapter;
        } else {
            type = ActionType.Commands;
            nextAdapter = this.commandAdapter;
        }

        if (type !== this.actionType) {
            this.currentAdapter?.unmount();
            this.currentAdapter = nextAdapter;
            this.currentAdapter.mount();
        }

        if (!this.currentAdapter.initialized) {
            this.currentAdapter.initialize();
        }

        const wasUpdated = type !== this.actionType;
        this.actionType = type;

        if (wasUpdated) {
            this.updateEmptyStateText();
            this.updateTitleText();
            this.updateInstructions();
            this.currentSuggestions = this.currentAdapter
                .getSortedItems()
                .slice(0, this.suggestionLimit);
        }

        return wasUpdated;
    }

    updateTitleText() {
        if (this.plugin.settings.showPluginName) {
            this.modalTitleEl.setText(this.currentAdapter.getTitleText());
        } else {
            this.modalTitleEl.setText('');
        }
    }

    updateEmptyStateText() {
        this.emptyStateText = this.currentAdapter.getEmptyStateText();
    }

    updateInstructions() {
        Array.from(this.modalEl.getElementsByClassName('prompt-instructions'))
            .forEach((instruction) => {
                this.modalEl.removeChild(instruction);
            });

        this.setInstructions([
            ...this.currentAdapter.getInstructions(),
            { command: generateHotKeyText({ modifiers: [], key: 'ESC' }, this.plugin.settings), purpose: 'Close palette' },
            { command: generateHotKeyText({ modifiers: ['Mod'], key: 'I' }, this.plugin.settings), purpose: 'Toggle Hidden Items' },
        ]);
    }

    getItems(): Match[] {
        return this.currentAdapter.getSortedItems();
    }

    receivedSuggestions(msg : MessageEvent) {
        const results = [];
        let hiddenCount = 0;

        for (
            let i = 0;
            i < msg.data.length && results.length < this.suggestionLimit + hiddenCount;
            i += 1
        ) {
            results.push(msg.data[i]);

            if (this.currentAdapter.hiddenIds.includes(msg.data[i].id)) {
                hiddenCount += 1;
            }
        }

        const matches = results.map((r : Match) => new PaletteMatch(r.id, r.text, r.tags));

        // Sort the suggestions so that previously searched items are first
        const prevItems = this.currentAdapter.getPrevItems();
        matches.sort((a, b) => (+prevItems.has(b)) - (+prevItems.has(a)));

        this.currentSuggestions = matches;
        this.limit = this.currentSuggestions.length;
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

        const visibleItems = this.currentSuggestions.filter(
            (match) => !this.currentAdapter.hiddenIds.includes(match.id),
        );

        const hiddenItemCount = this.currentSuggestions.length - visibleItems.length;

        this.updateHiddenItemCountHeader(hiddenItemCount);

        // For now return what we currently have. We'll populate results later if we need to
        return this.showHiddenItems ? this.currentSuggestions : visibleItems;
    }

    updateHiddenItemCountHeader(hiddenItemCount: number) {
        this.hiddenItemsHeaderEl.empty();

        if (hiddenItemCount !== 0) {
            const text = `${this.showHiddenItems ? 'Hide' : 'Show'} hidden items (${hiddenItemCount})`;
            this.hiddenItemsHeaderEl.setText(text);
        }
    }

    renderSuggestion(match: Match, el: HTMLElement) {
        el.addClass('mod-complex');

        const isHidden = this.currentAdapter.hiddenIds.includes(match.id);

        if (isHidden) {
            el.addClass('hidden');
        }

        const icon = 'cross';

        const suggestionContent = el.createEl('span', 'suggestion-content');
        const suggestionAux = el.createEl('span', 'suggestion-aux');

        const flairContainer = suggestionAux.createEl('span', 'suggestion-flair');
        renderPrevItems(match, suggestionContent, this.currentAdapter.getPrevItems());

        setIcon(flairContainer, icon, 13);
        flairContainer.ariaLabel = isHidden ? 'Click to Unhide' : 'Click to Hide';
        flairContainer.setAttr('data-id', match.id);

        flairContainer.onClickEvent((event) => {
            event.preventDefault();
            event.stopPropagation();

            const hideEl = event.target as HTMLElement;

            this.currentAdapter.toggleHideId(hideEl.getAttr('data-id')!);
        });

        this.currentAdapter.renderSuggestion(match, suggestionContent, suggestionAux);
    }

    async onChooseSuggestion(item: Match, event: MouseEvent | KeyboardEvent) {
        this.currentAdapter.onChooseSuggestion(item, event);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runHotkey(event: KeyboardEvent) {
        if (event.key === 'Shift' || event.key === 'Ctrl' || event.key === 'Alt' || event.key === 'Meta') {
            return;
        }
        this.close(event);
        const key = event.key.toLowerCase();
        const commandToRun = this.app.commands.listCommands().find(
            (command) => command.hotkeys?.some(
                (hotkey) => hotkey.key.toLowerCase() === key && hotkey.modifiers.every(
                    (m) => this.activeMods[m],
                ),
            ),
        );
        if (commandToRun) {
            this.app.commands.executeCommandById(commandToRun.id);
        } else {
            const modifiers = Object
                .entries(this.activeMods)
                .filter(([, value]) => value)
                .map(([k]) => k);
            // eslint-disable-next-line no-new
            new Notice(`Hokey not found: ${generateHotKeyText({ key, modifiers }, this.plugin.settings)}`, 2000);
        }
    }
}

export default BetterCommandPaletteModal;
