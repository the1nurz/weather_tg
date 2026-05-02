const fs = require("fs");
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

module.exports = {
    readFileByLines
};
