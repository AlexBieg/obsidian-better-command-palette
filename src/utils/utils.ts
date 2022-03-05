import {
    App, Command, Hotkey, Modifier, normalizePath, parseFrontMatterAliases,
    parseFrontMatterTags, Platform, TFile,
} from 'obsidian';
import { BetterCommandPalettePluginSettings } from 'src/settings';
import { Match, UnsafeMetadataCacheInterface } from 'src/types/types';
import PaletteMatch from './palette-match';
import OrderedSet from './ordered-set';
import {
    BASIC_MODIFIER_ICONS, HYPER_KEY_MODIFIERS_SET, MAC_MODIFIER_ICONS, SPECIAL_KEYS,
} from './constants';

/**
 * Determines if the modifiers of a hotkey could be a hyper key command.
 * @param {Modifier[]} modifiers An array of modifiers
 * @returns {boolean} Do the modifiers make up a hyper key command
 */
function isHyperKey(modifiers: Modifier[]) : boolean {
    if (modifiers.length !== 4) {
        return false;
    }

    return modifiers.every((m) => HYPER_KEY_MODIFIERS_SET.has(m));
}

/**
 * A utility that generates the text of a Hotkey for UIs
 * @param {Hotkey} hotkey The hotkey to generate text for
 * @returns {string} The hotkey text
 */
export function generateHotKeyText(
    hotkey: Hotkey,
    settings: BetterCommandPalettePluginSettings,
): string {
    let modifierIcons = Platform.isMacOS ? MAC_MODIFIER_ICONS : BASIC_MODIFIER_ICONS;

    if (settings.hotkeyStyle === 'mac') {
        modifierIcons = MAC_MODIFIER_ICONS;
    } else if (settings.hotkeyStyle === 'windows') {
        modifierIcons = BASIC_MODIFIER_ICONS;
    }

    const hotKeyStrings: string[] = [];

    if (settings.hyperKeyOverride && isHyperKey(hotkey.modifiers)) {
        hotKeyStrings.push(modifierIcons.Hyper);
    } else {
        hotkey.modifiers.forEach((mod: Modifier) => {
            hotKeyStrings.push(modifierIcons[mod]);
        });
    }

    const key = hotkey.key.toUpperCase();
    hotKeyStrings.push(SPECIAL_KEYS[key] || key);

    return hotKeyStrings.join(' ');
}

export function renderPrevItems(match: Match, el: HTMLElement, prevItems: OrderedSet<Match>) {
    if (prevItems.has(match)) {
        el.addClass('recent');
        el.createEl('span', {
            cls: 'recent-text',
            text: '(recently used)',
        });
    }
}

export function getCommandText(item: Command): string {
    return item.name;
}

export async function getOrCreateFile(app: App, path: string) : Promise < TFile > {
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

export function openFileWithEventKeys(
    app: App,
    file: TFile,
    event: MouseEvent | KeyboardEvent,
) {
    const { workspace } = app;

    let leaf = workspace.activeLeaf;

    // Shift key means we should be using a new leaf
    if (event.shiftKey) {
        leaf = workspace.createLeafBySplit(workspace.activeLeaf);
        workspace.setActiveLeaf(leaf);
    }

    leaf.openFile(file);
}

export function matchTag(tags: string[], tagQueries: string[]): boolean {
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

export function createPaletteMatchesFromFilePath(
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
