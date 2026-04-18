const SKIP = Symbol("skip");

function abortError() {
    const error = new Error("aborted");
    error.name = "AbortError";
    return error;
}

function asyncFilterMapCallback(array, callback, done, options = {}) {
    const signal = options.signal;
    const result = [];
    let i = 0;
    let finished = false;

    function end(error) {
        if (finished) {
            return;
        }

        finished = true;

        if (signal) {
            signal.removeEventListener("abort", onAbort);
        }

        done(error, result);
    }

    function onAbort() {
        end(abortError());
    }

    function run() {
        if (finished) {
            return;
        }

        if (signal && signal.aborted) {
            end(abortError());
            return;
        }

        if (i >= array.length) {
            end(null);
            return;
        }

        callback(array[i], i, array, (error, value) => {
            if (error) {
                end(error);
                return;
            }

            if (value !== SKIP) {
                result.push(value);
            }

            i += 1;
            run();
        });
    }

    if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
    }

    run();
}

function asyncFilterMap(array, callback, options = {}) {
    const signal = options.signal;

    return new Promise(async (resolve, reject) => {
        const result = [];

        function onAbort() {
            reject(abortError());
        }

        if (signal) {
            signal.addEventListener("abort", onAbort, { once: true });
        }

        try {
            for (let i = 0; i < array.length; i += 1) {
                if (signal && signal.aborted) {
                    throw abortError();
                }

                const value = await callback(array[i], i, array);

                if (value !== SKIP) {
                    result.push(value);
                }
            }

            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            if (signal) {
                signal.removeEventListener("abort", onAbort);
            }
        }
    });
}

module.exports = {
    asyncFilterMap,
    asyncFilterMapCallback,
    SKIP
};
