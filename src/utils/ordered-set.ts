import { Comparable } from 'src/types/types';

/**
 * A utility set that keeps track of the last time an item was added to the
 * set even if it was already in the set.
 */
export default class OrderedSet<T extends Comparable> {
    private map: Map<string, T>;

    constructor(values: T[] = []) {
        this.map = new Map<string, T>();
        values.forEach((v) => this.map.set(v.value(), v));
    }

    has(item: T): boolean {
        return this.map.has(item.value());
    }

    add(item: T) {
        this.delete(item);

        return this.map.set(item.value(), item);
    }

    addAll(items: T[]) {
        items.forEach((item) => this.add(item));
    }

    delete(item: T) {
        this.map.delete(item.value());
    }

    values(): T[] {
        return Array.from(this.map.values());
    }

    valuesByLastAdd(): T[] {
        return Array.from(this.map.values()).reverse();
    }
}
