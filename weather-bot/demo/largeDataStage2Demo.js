const path = require("path");
const { readFileByLines } = require("../utils/largeDataReader");
const { filterAsync, mapAsync } = require("../utils/streamHelpers");

function parseWeatherLine(line) {
    const parts = line.split(",");

    return {
        city: parts[0],
        temperature: Number(parts[1]),
        description: parts[2]
    };
}

async function runDemo() {
    const filePath = path.join(__dirname, "..", "data", "weather-logs.txt");

    const lines = readFileByLines(filePath);

    const parsedWeather = mapAsync(lines, async (line) => {
        return parseWeatherLine(line);
    });

    const onlyHotWeather = filterAsync(parsedWeather, async (weather) => {
        return weather.temperature >= 20;
    });

    const messages = mapAsync(onlyHotWeather, async (weather) => {
        return `${weather.city}: ${weather.temperature}C, ${weather.description}`;
    });

    let count = 0;

    for await (const message of messages) {
        count += 1;
        console.log(message);
    }

    console.log("Hot weather records:", count);
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
