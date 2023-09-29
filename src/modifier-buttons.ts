import {
    ButtonComponent, Modifier,
} from 'obsidian';
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
 */
export default class ModifierButtons {
    readonly modifiersEl: HTMLElement;

    activeModifiers = new Set<Modifier>();

    private fileButton: ButtonComponent;

    private tagButton: ButtonComponent;

    private readonly modifierButtons = new Map<Modifier, ButtonComponent>();

    private hyperButton: ButtonComponent | undefined;

    private modifierInfo: ModifierInfo;

    #actionType: ActionType = ActionType.Commands;

    constructor(
        private readonly plugin: BetterCommandPalettePlugin,
        private readonly onButtonStatesChanged: () => void,
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
                .onClick(() => this.onHyper());
        }

        this.modifiersEl.querySelectorAll('button').forEach((el) => {
            el.setAttribute('tabindex', '-1');
        });
    }

    get actionType(): ActionType {
        return this.#actionType;
    }

    get modifiersAreValid(): boolean {
        return this.activeModifiers.size >= 2 || (this.activeModifiers.size === 1 && !this.activeModifiers.has('Shift'));
    }

    reset(): void {
        this.setActiveModifiers(new Set());
    }

    private toggleModifier(modifier: Modifier): void {
        if (this.activeModifiers.has(modifier)) {
            this.activeModifiers.delete(modifier);
        } else {
            this.activeModifiers.add(modifier);
        }
        this.setActiveModifiers(this.activeModifiers);
    }

    private onHyper(): void {
        if (this.hyperButton) {
            if (sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET)) {
                this.setActiveModifiers(new Set());
            } else {
                this.setActiveModifiers(new Set(HYPER_KEY_MODIFIERS_SET));
            }
        }
    }

    private toggleActionType(actionType: Exclude<ActionType, ActionType.Hotkey>) {
        if (this.#actionType === actionType) {
            this.#actionType = ActionType.Commands;
        } else {
            this.#actionType = actionType;
        }
        this.activeModifiers.clear();
        this.updateButtonStates();
    }

    private setActiveModifiers(activeModifiers: Set<Modifier>): void {
        this.#actionType = activeModifiers.size === 0 ? ActionType.Commands : ActionType.Hotkey;
        this.activeModifiers = activeModifiers;
        this.updateButtonStates();
    }

    private updateButtonStates(): void {
        setCta(this.fileButton, this.#actionType === ActionType.Files);
        setCta(this.tagButton, this.#actionType === ActionType.Tags);
        [...this.modifierInfo.buttonOrder].forEach((modifier) => {
            setCta(this.modifierButtons.get(modifier)!, this.activeModifiers.has(modifier));
        });
        if (this.hyperButton) {
            setCta(this.hyperButton, sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET));
        }

        this.onButtonStatesChanged();
    }
}
