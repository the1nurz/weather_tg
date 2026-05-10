const fs = require("fs");
const path = require("path");
const readline = require("readline");

async function* readFileByLines(filePath) {
    const fileStream = fs.createReadStream(filePath, {
        encoding: "utf8"
    });

    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of lines) {
        yield line;
    }
}

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
        yield await changeItem(item);
    }
}

function parseWeatherLine(line) {
    const parts = line.split(",");

    return {
        city: parts[0],
        temperature: Number(parts[1]),
        description: parts[2]
    };
}

function writeLine(stream, text) {
    return new Promise((resolve, reject) => {
        stream.write(`${text}\n`, (error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

async function saveReport(items, filePath) {
    const output = fs.createWriteStream(filePath, {
        encoding: "utf8"
    });

    let count = 0;

    for await (const item of items) {
        await writeLine(output, item);
        count += 1;
    }

    output.end();
    return count;
}

async function runDemo() {
    const inputPath = path.join(__dirname, "..", "data", "weather-logs.txt");
    const outputPath = path.join(__dirname, "..", "data", "hot-weather-report.txt");

    const lines = readFileByLines(inputPath);

    const weatherItems = mapAsync(lines, async (line) => {
        return parseWeatherLine(line);
    });

    const hotWeatherItems = filterAsync(weatherItems, async (weather) => {
        return weather.temperature >= 20;
    });

    const reportLines = mapAsync(hotWeatherItems, async (weather) => {
        return `${weather.city}; ${weather.temperature}C; ${weather.description}`;
    });

    const savedLines = await saveReport(reportLines, outputPath);

    console.log("Saved report:", outputPath);
    console.log("Saved lines:", savedLines);
}

if (require.main === module) {
    runDemo().catch((error) => {
        console.error("Demo failed:", error);
        process.exitCode = 1;
    });
}

module.exports = {
    runDemo
};
