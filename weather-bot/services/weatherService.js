const axios = require("axios");

async function getWeather(city) {
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
        throw new Error("WEATHER_API_KEY is not set");
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ua`;
    const res = await axios.get(url);
    const dayForecast = res.data.list.slice(0, 8);

    let tempSum = 0;
    let minTemp = dayForecast[0].main.temp_min;
    let maxTemp = dayForecast[0].main.temp_max;
    let willRain = false;
    let maxRainChance = 0;
    let maxWindSpeed = 0;
    const descriptions = {};

    for (let i = 0; i < dayForecast.length; i += 1) {
        const item = dayForecast[i];
        const temp = item.main.temp;
        const description = item.weather[0].description;
        const main = item.weather[0].main.toLowerCase();
        const rainChance = item.pop || 0;

        tempSum += temp;
        maxRainChance = Math.max(maxRainChance, rainChance);
        maxWindSpeed = Math.max(maxWindSpeed, item.wind.speed);

        if (item.main.temp_min < minTemp) {
            minTemp = item.main.temp_min;
        }

        if (item.main.temp_max > maxTemp) {
            maxTemp = item.main.temp_max;
        }

        if (main === "rain" || main === "drizzle" || main === "thunderstorm") {
            willRain = true;
        }

        if (!descriptions[description]) {
            descriptions[description] = 0;
        }

        descriptions[description] += 1;
    }

    let mainDescription = dayForecast[0].weather[0].description;
    let maxCount = 0;

    for (const description in descriptions) {
        if (descriptions[description] > maxCount) {
            mainDescription = description;
            maxCount = descriptions[description];
        }
    }

    const averageTemp = tempSum / dayForecast.length;

    return {
        temp: Math.round(averageTemp),
        minTemp: Math.round(minTemp),
        maxTemp: Math.round(maxTemp),
        description: mainDescription,
        willRain: willRain,
        rainChance: Math.round(maxRainChance * 100),
        windSpeed: Math.round(maxWindSpeed)
    };
}

module.exports = getWeather;
