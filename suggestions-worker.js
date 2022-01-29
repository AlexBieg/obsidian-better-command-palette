import fuzzySearch from './fuzzy-search';

self.onmessage = async (msg) => {
    const query = msg.data.query;
    const items = msg.data.items;
    // Just return everything if there is no query
    const results = query === '' ?
        items :
        fuzzySearch.go(query, items, { key: 'text' }).map((r) => r.obj);
    self.postMessage(results);
}
