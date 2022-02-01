import { Match } from 'src/types/types';

export default class PaletteMatch implements Match {
    id: string;

    text: string;

    constructor(id: string, text: string) {
        this.id = id;
        this.text = text;
    }

    value(): string {
        return this.id;
    }
}
