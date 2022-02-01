import fuzzySearch from '../utils/fuzzy-search';

// Need `self` for the web worker to function correctly
// eslint-disable-next-line
self.onmessage = async (msg) => {
    const { query } = msg.data;
    const { items } = msg.data;
    // Just return everything if there is no query
    const results = query === ''
        ? items
        : fuzzySearch.go(query, items, { key: 'text' }).map((r) => r.obj);
    // eslint-disable-next-line
    self.postMessage(results);
};
