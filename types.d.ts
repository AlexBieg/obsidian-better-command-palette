export interface Comparable {
    value: () => string;
}

export interface Match extends Comparable {
    text: string,
    id: string,
}
