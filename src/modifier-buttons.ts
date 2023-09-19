import {
    ButtonComponent, ExtraButtonComponent, Modifier,
} from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import {
    getEffectiveHotkeyStyle,
    getModifierInfo,
    sameSet,
} from 'src/utils';
import { HYPER_KEY_MODIFIERS_SET, ModifierInfo } from './utils/constants';

/**
 * A set of buttons for toggling modifiers used to simulate hotkeys.
 */
export default class ModifierButtons {
    readonly modifiersEl: HTMLElement;

    activeModifiers = new Set<Modifier>();

    private readonly modifierButtons = new Map<Modifier, ButtonComponent>();

    private hyperButton: ButtonComponent | undefined;

    private modifierInfo: ModifierInfo;

    constructor(
        private readonly plugin: BetterCommandPalettePlugin,
        private readonly onClose: () => void,
        private readonly onModifiersChanged: () => void,
    ) {
        this.modifierInfo = getModifierInfo(this.plugin.settings);

        this.modifiersEl = createDiv({ cls: 'better-command-palette-buttons' });

        this.modifierInfo.order.forEach((modifier) => {
            this.modifierButtons.set(
                modifier,
                new ButtonComponent(this.modifiersEl)
                    .setButtonText(this.modifierInfo.icons[modifier])
                    .onClick(() => this.toggleModifier(modifier)),
            );
        });

        if (this.plugin.settings.hyperKeyOverride && getEffectiveHotkeyStyle(this.plugin.settings) === 'mac') {
            this.hyperButton = new ButtonComponent(this.modifiersEl)
                .setButtonText(this.modifierInfo.icons.Hyper)
                .onClick(() => this.onHyper());
        }

        this.modifiersEl.createDiv({ cls: 'better-command-palette-spacer' });
        const closeButton = new ExtraButtonComponent(this.modifiersEl);
        closeButton
            .setIcon('x')
            .onClick(this.onClose);

        this.modifiersEl.querySelectorAll('button').forEach((el) => {
            el.setAttribute('tabindex', '-1');
        });
    }

    get expectingHotkey(): boolean {
        return this.activeModifiers.size !== 0;
    }

    get modifiersAreValid(): boolean {
        return this.activeModifiers.size >= 2 || (this.activeModifiers.size === 1 && !this.activeModifiers.has('Shift'));
    }

    private toggleModifier(modifier: Modifier): void {
        if (this.activeModifiers.has(modifier)) {
            this.activeModifiers.delete(modifier);
        } else {
            this.activeModifiers.add(modifier);
        }
        this.updateModifierButtonStates();
    }

    private onHyper(): void {
        if (this.hyperButton) {
            if (sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET)) {
                this.activeModifiers.clear();
            } else {
                this.activeModifiers = new Set(HYPER_KEY_MODIFIERS_SET);
            }
        }
        this.updateModifierButtonStates();
    }

    private updateModifierButtonStates(): void {
        [...this.modifierInfo.order].forEach((modifier) => {
            if (this.activeModifiers.has(modifier)) {
                this.modifierButtons.get(modifier)?.setCta();
            } else {
                this.modifierButtons.get(modifier)?.removeCta();
            }
        });
        if (this.hyperButton) {
            if (sameSet(this.activeModifiers, HYPER_KEY_MODIFIERS_SET)) {
                this.hyperButton.setCta();
            } else {
                this.hyperButton.removeCta();
            }
        }

        this.onModifiersChanged();
    }
}
