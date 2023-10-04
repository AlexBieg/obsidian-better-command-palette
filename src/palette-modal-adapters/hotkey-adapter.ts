import { Instruction } from 'obsidian';
import {
    SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';

export default class BetterCommandPaletteHotkeyAdapter extends SuggestModalAdapter {
    titleText = 'Better Command Palette: Hotkeys';

    emptyStateText = '';

    // Unsafe Interfaces
    declare app: UnsafeAppInterface;

    readonly onChangeListener = () => {
        const { value } = this.palette.inputEl;
        if (value !== '') {
            if (value.length === 1) {
                this.palette.runHotkey(value);
            }
            this.palette.inputEl.value = '';
        }
    };

    mount(): void {
        const { palette } = this;
        palette.inputEl.addEventListener('input', this.onChangeListener);
        palette.resultContainerEl.setAttribute('hidden', 'true');
    }

    unmount(): void {
        const { palette } = this;
        palette.inputEl.removeEventListener('input', this.onChangeListener);
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
