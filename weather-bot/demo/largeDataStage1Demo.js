const path = require("path");
const { readFileByLines } = require("../utils/largeDataReader");

async function runDemo() {
    const filePath = path.join(__dirname, "..", "data", "weather-logs.txt");

    let totalLines = 0;
    let hotDays = 0;

    for await (const line of readFileByLines(filePath)) {
        totalLines += 1;

        const parts = line.split(",");
        const city = parts[0];
        const temperature = Number(parts[1]);

        if (temperature >= 20) {
            hotDays += 1;
            console.log(`${city}: ${temperature}C`);
        }
    }

    console.log("Processed lines:", totalLines);
    console.log("Days with temperature >= 20C:", hotDays);
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
