/* eslint-disable no-restricted-globals */
// We need to accesss self in our web worker

import * as fuzzySearch from 'fuzzysort';
import { Message } from 'src/types/types';
import { QUERY_OR, QUERY_TAG } from 'src/utils/constants';

self.onmessage = (msg: Message) => {
    const { query, items } = msg.data;

    const [mainQuery, ...tagQueries] = query.split(QUERY_TAG);

    let results = items;

    if (mainQuery.includes(QUERY_OR)) {
        const subqueries = mainQuery.split(QUERY_OR).map((q) => q.trim());
        results = items.filter((item) => subqueries.includes(item.text));
    } else if (mainQuery !== '') {
        results = fuzzySearch
            .go(mainQuery, items, { key: 'text' })
            .map((r) => r.obj);
    }

    tagQueries.forEach((tq) => {
        results = results.filter((r) => r.tags.includes(tq));
    });

    return self.postMessage(results);
};
