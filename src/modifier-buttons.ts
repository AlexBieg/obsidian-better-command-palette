import { ButtonComponent, Modifier } from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import {
    getEffectiveHotkeyStyle,
    getModifierInfo,
    sameSet,
    setCta,
} from 'src/utils';
import { ActionType, HYPER_KEY_MODIFIERS_SET, ModifierInfo } from './utils/constants';

/**
 * A set of buttons for toggling modifiers used to simulate hotkeys.
 *
 * Maintans the following class invariant: `activeModifiers` is empty iff
 * `actionType !== ActionType.Hotkey`.
 */
export default class ModifierButtons {
    readonly modifiersEl: HTMLElement;

    activeModifiers = new Set<Modifier>();

    #actionType: ActionType = ActionType.Commands;

    private fileButton: ButtonComponent;

    private tagButton: ButtonComponent;

    private readonly modifierButtons = new Map<Modifier, ButtonComponent>();

    private hyperButton: ButtonComponent | undefined;

    private modifierInfo: ModifierInfo;


    constructor(
        private readonly plugin: BetterCommandPalettePlugin,
        private readonly onSelectionChanged: () => void,
    ) {
        this.modifierInfo = getModifierInfo(this.plugin.settings);

        this.modifiersEl = createDiv({ cls: 'better-command-palette-button-box' });

        this.fileButton = new ButtonComponent(this.modifiersEl)
            .setIcon('file-search')
            .setClass('better-command-palette-button')
            .onClick(() => this.toggleActionType(ActionType.Files));

        this.tagButton = new ButtonComponent(this.modifiersEl)
            .setIcon('tag')
            .setClass('better-command-palette-button')
            .onClick(() => this.toggleActionType(ActionType.Tags));

        this.modifierInfo.buttonOrder.forEach((modifier) => {
            this.modifierButtons.set(
                modifier,
                new ButtonComponent(this.modifiersEl)
                    .setButtonText(this.modifierInfo.icons[modifier])
                    .setClass('better-command-palette-button')
                    .onClick(() => this.toggleModifier(modifier)),
            );
        });

        if (this.plugin.settings.hyperKeyOverride && getEffectiveHotkeyStyle(this.plugin.settings) === 'mac') {
            this.hyperButton = new ButtonComponent(this.modifiersEl)
                .setButtonText(this.modifierInfo.icons.Hyper)
                .setClass('better-command-palette-button')
                .onClick(() => this.toggleHyper());
        }

        this.modifiersEl.querySelectorAll('button').forEach((el) => {
            el.setAttribute('tabindex', '-1');
        });
    }

    get actionType(): ActionType {
        return this.#actionType;
    }

    set actionType(type: ActionType) {
        this.#actionType = type;
        this.onActionTypeChanged(false);
    }

    get modifiersAreValid(): boolean {
        return this.activeModifiers.size >= 2 || (this.activeModifiers.size === 1 && !this.activeModifiers.has('Shift'));
    }

    reset(): void {
        this.activeModifiers.clear();
        this.onModifiersChanged();
    }

    private toggleModifier(modifier: Modifier): void {
        if (this.activeModifiers.has(modifier)) {
            this.activeModifiers.delete(modifier);
        } else {
            this.activeModifiers.add(modifier);
        }
        this.onModifiersChanged();
    }

    private toggleHyper(): void {
        if (!this.hyperButton) {
            return;
        }
        if (sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET)) {
            this.activeModifiers.clear();
        } else {
            this.activeModifiers = new Set(HYPER_KEY_MODIFIERS_SET);
        }
    }

    private toggleActionType(actionType: Exclude<ActionType, ActionType.Hotkey>) {
        if (this.#actionType === actionType) {
            this.#actionType = ActionType.Commands;
        } else {
            this.#actionType = actionType;
        }
        this.onActionTypeChanged(true);
    }

    private onActionTypeChanged(runCallback: boolean): void {
        // Restore the class invariant prioritzing the new action type.
        if (this.#actionType !== ActionType.Hotkey) {
            this.activeModifiers.clear();
        }

        this.updateButtonAppearance();
        if (runCallback) {
            this.onSelectionChanged();
        }
    }

    private onModifiersChanged(): void {
        // Restore the class invariant prioritizing the new modifier set.
        if (this.activeModifiers.size > 0) {
            this.#actionType = ActionType.Hotkey;
        } else {
            this.#actionType = ActionType.Commands;
        }

        this.updateButtonAppearance();
        this.onSelectionChanged();
    }

    private updateButtonAppearance(): void {
        setCta(this.fileButton, this.#actionType === ActionType.Files);
        setCta(this.tagButton, this.#actionType === ActionType.Tags);
        [...this.modifierInfo.buttonOrder].forEach((modifier) => {
            setCta(this.modifierButtons.get(modifier)!, this.activeModifiers.has(modifier));
        });
        if (this.hyperButton) {
            setCta(this.hyperButton, sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET));
        }
    }
}
