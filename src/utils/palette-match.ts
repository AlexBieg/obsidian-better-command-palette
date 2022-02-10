import { Match } from 'src/types/types';

export default class PaletteMatch implements Match {
    id: string;

    text: string;

    tags: string[];

    constructor(id: string, text: string, tags: string[] = []) {
        this.id = id;
        this.text = text;
        this.tags = tags;
    }

    value(): string {
        return this.id;
    }
}
