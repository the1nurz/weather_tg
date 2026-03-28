function memoize(fn, options = {}) {
    if (typeof options === "number") {
        options = { ttl: options };
    }

    const ttl = Number.isFinite(options.ttl) ? options.ttl : Infinity;
    const maxSize = Number.isFinite(options.maxSize) ? options.maxSize : Infinity;
    const policy = (options.policy || "none").toLowerCase();
    const resolver = typeof options.resolver === "function"
        ? options.resolver
        : (...args) => JSON.stringify(args);
    const customEviction = typeof options.eviction === "function"
        ? options.eviction
        : null;

    const cache = new Map();
    const getTimestamp = (value) => value instanceof Date ? value.getTime() : value;
    const getNow = () => new Date();

    function removeExpired() {
        const now = getNow().getTime();

        for (const [key, entry] of cache.entries()) {
            if (now - getTimestamp(entry.time) >= ttl) {
                cache.delete(key);
            }
        }
    }

    function getKeyToDelete() {
        const entries = Array.from(cache.entries());

        if (entries.length === 0) {
            return null;
        }

        if (customEviction) {
            return customEviction(entries.map(([key, entry]) => ({
                key,
                value: entry.value,
                time: entry.time,
                lastUsed: entry.lastUsed,
                hits: entry.hits
            })));
        }

        let selectedKey = entries[0][0];
        let selectedEntry = entries[0][1];

        for (let i = 1; i < entries.length; i += 1) {
            const [key, entry] = entries[i];

            if (policy === "lru") {
                if (getTimestamp(entry.lastUsed) < getTimestamp(selectedEntry.lastUsed)) {
                    selectedKey = key;
                    selectedEntry = entry;
                }
            } else if (policy === "lfu") {
                if (
                    entry.hits < selectedEntry.hits ||
                    (
                        entry.hits === selectedEntry.hits &&
                        getTimestamp(entry.lastUsed) < getTimestamp(selectedEntry.lastUsed)
                    )
                ) {
                    selectedKey = key;
                    selectedEntry = entry;
                }
            } else {
                selectedKey = entries[0][0];
            }
        }

        return selectedKey;
    }

    function limitCacheSize() {
        while (cache.size > maxSize) {
            const keyToDelete = getKeyToDelete();

            if (keyToDelete === null || !cache.has(keyToDelete)) {
                break;
            }

            cache.delete(keyToDelete);
        }
    }

    return function(...args) {
        removeExpired();

        const key = resolver(...args);
        const now = getNow();
        const nowTimestamp = now.getTime();

        if (cache.has(key)) {
            const entry = cache.get(key);

            if (nowTimestamp - getTimestamp(entry.time) < ttl) {
                entry.lastUsed = now;
                entry.hits += 1;
                return entry.value;
            }

            cache.delete(key);
        }

        const result = fn.apply(this, args);
        const entry = {
            value: result,
            time: now,
            lastUsed: now,
            hits: 1
        };

        cache.set(key, entry);
        limitCacheSize();

        if (result && typeof result.then === "function") {
            return result.catch((error) => {
                if (cache.get(key) === entry) {
                    cache.delete(key);
                }

                throw error;
            });
        }

        return result;
    };
}

module.exports = memoize;
