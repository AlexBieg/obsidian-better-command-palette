import { Instruction } from 'obsidian';
import {
    SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';

export default class BetterCommandPaletteHotkeyAdapter extends SuggestModalAdapter {
    titleText: string;

    emptyStateText: string;

    COMMAND_PLUGIN_NAME_SEPARATOR = ': ';

    // Unsafe Interfaces
    app: UnsafeAppInterface;

    allItems: Match[];

    pinnedItems: Match[];

    readonly onChangeListener = () => {
        if (this.palette.inputEl.value !== '') {
            this.palette.inputEl.value = '';
        }
    };

    readonly onKeyDownListener = (event: KeyboardEvent) => {
        event.preventDefault();
        this.palette.runHotkey(event);
    };

    initialize() {
        super.initialize();

        this.titleText = 'Better Command Palette: Hotkeys';
        this.emptyStateText = '';
    }

    mount(): void {
        const { palette } = this;
        palette.modalEl.addEventListener('keydown', this.onKeyDownListener);
        palette.resultContainerEl.setAttribute('hidden', 'true');
    }

    unmount(): void {
        const { palette } = this;
        palette.modalEl.addEventListener('keydown', this.onKeyDownListener);
        palette.resultContainerEl.removeAttribute('hidden');
    }

    getInstructions(): Instruction[] {
        return [];
    }

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void {
    }

    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    async onChooseSuggestion(_match: Match): Promise<void> {
    }
}
