import fuzzySearch from '../utils/fuzzy-search';

window.self.onmessage = async (msg) => {
    const { query } = msg.data;
    const { items } = msg.data;
    // Just return everything if there is no query
    const results = query === ''
        ? items
        : fuzzySearch.go(query, items, { key: 'text' }).map((r) => r.obj);
    window.self.postMessage(results);
};
