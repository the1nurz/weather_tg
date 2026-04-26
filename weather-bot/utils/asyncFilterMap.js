const SKIP = null;

function asyncFilterMapCallback(array, callback, done) {
    const result = [];
    let i = 0;

    function processNext() {
        if (i >= array.length) {
            done(null, result);
            return;
        }

        callback(array[i], i, array, (error, value) => {
            if (error) {
                done(error, null);
                return;
            }

            if (value !== SKIP) {
                result.push(value);
            }

            i += 1;
            processNext();
        });
    }

    processNext();
}

async function asyncFilterMap(array, callback) {
    const result = [];

    for (let i = 0; i < array.length; i += 1) {
        const value = await callback(array[i], i, array);

        if (value !== SKIP) {
            result.push(value);
        }
    }

    return result;
}

module.exports = {
    asyncFilterMap,
    asyncFilterMapCallback,
    SKIP
};
