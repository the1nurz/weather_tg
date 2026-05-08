async function* filterAsync(items, checkItem) {
    for await (const item of items) {
        const isOk = await checkItem(item);

        if (isOk) {
            yield item;
        }
    }
}

async function* mapAsync(items, changeItem) {
    for await (const item of items) {
        const newItem = await changeItem(item);
        yield newItem;
    }
}

module.exports = {
    filterAsync,
    mapAsync
};
