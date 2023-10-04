import {
    App, ButtonComponent, Command, Hotkey, Modifier, normalizePath, parseFrontMatterAliases,
    parseFrontMatterTags, Platform, TFile,
} from 'obsidian';
import { BetterCommandPalettePluginSettings } from 'src/settings';
import { Match, UnsafeMetadataCacheInterface } from 'src/types/types';
import PaletteMatch from './palette-match';
import OrderedSet from './ordered-set';
import {
    HYPER_KEY_MODIFIERS_SET,
    MODIFIER_INFO,
    ModifierInfo,
    SPECIAL_KEYS,
} from './constants';

export function setCta(component: ButtonComponent, value: boolean): void {
    if (value) {
        component.setCta();
    } else {
        component.removeCta();
    }
}

/**
 * Determines if the modifiers of a hotkey could be a hyper key command.
 * @param {Modifier[]} modifiers An array of modifiers
 * @returns {boolean} Do the modifiers make up a hyper key command
 */
function isHyperKey (modifiers: Modifier[]): boolean {
    if (modifiers.length !== 4) {
        return false;
    }

    return modifiers.every((m) => HYPER_KEY_MODIFIERS_SET.has(m));
}

export function getEffectiveHotkeyStyle(
    settings: BetterCommandPalettePluginSettings,
): 'mac' | 'windows' {
    if (settings.hotkeyStyle === 'auto') {
        return Platform.isMacOS || Platform.isIosApp
            ? 'mac'
            : 'windows';
    }
    return settings.hotkeyStyle;
}

export function getModifierInfo(
    settings: BetterCommandPalettePluginSettings,
): ModifierInfo {
    return MODIFIER_INFO[getEffectiveHotkeyStyle(settings)];
}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param {Hotkey} hotkey The hotkey to generate text for
 * @returns {string} The hotkey text
 */
export function generateHotKeyText (
    hotkey: Hotkey,
    settings: BetterCommandPalettePluginSettings,
): string {
    const modifierInfo = getModifierInfo(settings);

    const hotKeyStrings: string[] = [];

    if (settings.hyperKeyOverride && isHyperKey(hotkey.modifiers)) {
        hotKeyStrings.push(modifierInfo.icons.Hyper);
    } else {
        modifierInfo.hotkeyOrder.forEach((mod) => {
            if (hotkey.modifiers.includes(mod)) {
                hotKeyStrings.push(modifierInfo.icons[mod]);
            }
        });
    }

    let { key } = hotkey;
    if (key.length === 1) {
        key = key.toUpperCase();
    }
    hotKeyStrings.push(SPECIAL_KEYS[key] || key);

    return hotKeyStrings.join(modifierInfo.separator);
}

export function renderPrevItems (settings: BetterCommandPalettePluginSettings, match: Match, el: HTMLElement, prevItems: OrderedSet<Match>) {
    if (prevItems.has(match)) {
        el.addClass('recent');
        el.createEl('span', {
            cls: 'suggestion-note',
            text: settings.recentlyUsedText,
        });
    }
}

export function getCommandText (item: Command): string {
    return item.name;
}

export async function getOrCreateFile (app: App, path: string): Promise<TFile> {
    let file = app.metadataCache.getFirstLinkpathDest(path, '');

    if (!file) {
        const normalizedPath = normalizePath(`${path}.md`);
        const dirOnlyPath = normalizedPath.split('/').slice(0, -1).join('/');

        try {
            await app.vault.createFolder(dirOnlyPath);
        } catch (e) {
            // An error just means the folder path already exists
        }

        file = await app.vault.create(normalizedPath, '');
    }

    return file;
}

export function openFileWithEventKeys (
    app: App,
    settings: BetterCommandPalettePluginSettings,
    file: TFile,
    event: MouseEvent | KeyboardEvent,
) {
    // Figure if the file should be opened in a new tab
    const openInNewTab = settings.openInNewTabMod === 'Shift' ? event.shiftKey : event.metaKey || event.ctrlKey;

    // Open the file
    app.workspace.openLinkText(file.path, file.path, openInNewTab);
}

export function matchTag (tags: string[], tagQueries: string[]): boolean {
    for (let i = 0; i < tagQueries.length; i += 1) {
        const tagSearch = tagQueries[i];

        for (let ii = 0; ii < tags.length; ii += 1) {
            const tag = tags[ii];

            // If they are equal we have matched it
            if (tag === tagSearch) return true;

            // Check if the query could be a prefix for a nested tag
            const prefixQuery = `${tagSearch}/`;
            if (tag.startsWith(prefixQuery)) return true;
        }
    }
    return false;
}

export function createPaletteMatchesFromFilePath (
    metadataCache: UnsafeMetadataCacheInterface,
    filePath: string,
): PaletteMatch[] {
    // Get the cache item for the file so that we can extract its tags
    const fileCache = metadataCache.getCache(filePath);

    // Sometimes the cache keeps files that have been deleted
    if (!fileCache) return [];

    const cacheTags = (fileCache.tags || []).map((tc) => tc.tag);
    const frontmatterTags = parseFrontMatterTags(fileCache.frontmatter) || [];
    const tags = cacheTags.concat(frontmatterTags);

    const aliases = parseFrontMatterAliases(fileCache.frontmatter) || [];

    // Make the palette match
    return [
        new PaletteMatch(
            filePath,
            filePath, // Concat our aliases and path to make searching easy
            tags,
        ),
        ...aliases.map((alias: string) => new PaletteMatch(
            `${alias}:${filePath}`,
            alias,
            tags,
        )),
    ];
}

/**
 * Tests if two sets have the same members, or if a and array and a set contain
 * the same items.
 *
 * Will erroneously return false if `a` is an array with duplicate entires.
 */
export function sameSet<T>(a: Set<T> | T[], b: Set<T>): boolean {
    const left = a instanceof Array ? a : Array.from(a);
    if (left.length !== b.size) {
        return false;
    }
    return left.every((value) => b.has(value));
}
