function memoize(fn, ttl = 1800000) { // 30 хв
    const cache = new Map();

    return async function(city) {
        const now = Date.now();

        if (cache.has(city)) {
            const { value, time } = cache.get(city);

            if (now - time < ttl) {
                return value;
            }
        }

        const result = await fn(city);

        cache.set(city, {
            value: result,
            time: now
        });

        return result;
    };
}

module.exports = memoize;