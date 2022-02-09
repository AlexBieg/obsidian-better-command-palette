/* eslint-disable no-restricted-globals */
// We need to accesss self in our web worker

import * as fuzzySearch from 'fuzzysort';
import { Message } from 'src/types/types';
import { QUERY_OR } from 'src/utils/constants';

self.onmessage = (msg: Message) => {
    const { query, items } = msg.data;

    // Just return everything if there is no query
    if (query === '') return items;

    let results = [];
    if (query.includes(QUERY_OR)) {
        const subqueries = query.split(QUERY_OR).map((q) => q.trim());
        results = items.filter((item) => subqueries.includes(item.text));
    } else {
        results = fuzzySearch
            .go(query, items, { key: 'text' })
            .map((r) => r.obj);
    }

    return self.postMessage(results);
};
