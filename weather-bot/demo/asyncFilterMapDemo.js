const {
    SKIP,
    asyncFilterMap,
    asyncFilterMapCallback
} = require("../utils/asyncFilterMap");

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function demoCallbackVersion() {
    const cities = ["Kyiv", "Lviv", "Odesa", "Dnipro"];

    return new Promise((resolve, reject) => {
        asyncFilterMapCallback(cities, (city, index, array, next) => {
            setTimeout(() => {
                if (city.length > 4) {
                    next(null, `${index + 1}/${array.length}: ${city.toUpperCase()}`);
                    return;
                }

                next(null, SKIP);
            }, 120);
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            console.log("Callback version:", result);
            resolve(result);
        });
    });
}

function demoPromiseVersion() {
    const numbers = [3, 8, 11, 14, 17];

    return asyncFilterMap(numbers, async (value) => {
        await wait(90);

        if (value % 2 === 0) {
            return value * 10;
        }

        return SKIP;
    }).then((result) => {
        console.log("Promise version:", result);
        return result;
    });
}

async function demoAsyncAwaitVersion() {
    const forecasts = [
        { city: "Kyiv", temp: 19 },
        { city: "Lviv", temp: 14 },
        { city: "Odesa", temp: 22 },
        { city: "Kharkiv", temp: 17 }
    ];

    const result = await asyncFilterMap(forecasts, async (forecast) => {
        await wait(80);

        if (forecast.temp < 18) {
            return SKIP;
        }

        return `${forecast.city}: ${forecast.temp}C`;
    });

    console.log("Async/await version:", result);
    return result;
}

async function demoAbortableVersion() {
}

async function runDemo() {
    await demoCallbackVersion();
    await demoPromiseVersion();
    await demoAsyncAwaitVersion();
    await demoAbortableVersion();
}

if (require.main === module) {
    runDemo().catch((error) => {
        console.error("Demo failed:", error);
        process.exitCode = 1;
    });
}

module.exports = {
    demoAbortableVersion,
    demoAsyncAwaitVersion,
    demoCallbackVersion,
    demoPromiseVersion,
    runDemo
};
