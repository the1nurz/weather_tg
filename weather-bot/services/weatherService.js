const axios = require("axios");

function calculateFeelsLike(temp, windSpeed) {
    if (temp >= 10) {
        return temp;
    }

    const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
    return Math.round(windChill);
}

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
    let minFeelsLike = 999;
    let maxFeelsLike = -999;
    let willRain = false;
    let maxRainChance = 0;
    let maxWindSpeed = 0;
    let rainCount = 0;
    const descriptions = {};
    const weatherTypes = {};

    for (let i = 0; i < dayForecast.length; i += 1) {
        const item = dayForecast[i];
        const temp = item.main.temp;
        const description = item.weather[0].description;
        const main = item.weather[0].main.toLowerCase();
        const rainChance = item.pop || 0;
        const windSpeed = item.wind.speed;

        const feelsLike = calculateFeelsLike(temp, windSpeed);

        tempSum += temp;
        maxRainChance = Math.max(maxRainChance, rainChance);
        maxWindSpeed = Math.max(maxWindSpeed, windSpeed);
        minFeelsLike = Math.min(minFeelsLike, feelsLike);
        maxFeelsLike = Math.max(maxFeelsLike, feelsLike);

        if (item.main.temp_min < minTemp) {
            minTemp = item.main.temp_min;
        }

        if (item.main.temp_max > maxTemp) {
            maxTemp = item.main.temp_max;
        }

        if (main === "rain" || main === "drizzle" || main === "thunderstorm") {
            willRain = true;
            rainCount += 1;
        }

        if (!descriptions[description]) {
            descriptions[description] = 0;
        }

        descriptions[description] += 1;

        if (!weatherTypes[main]) {
            weatherTypes[main] = 0;
        }
        weatherTypes[main] += 1;
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
        minFeelsLike: minFeelsLike,
        maxFeelsLike: maxFeelsLike,
        description: mainDescription,
        willRain: willRain,
        rainChance: Math.round(maxRainChance * 100),
        rainCount: rainCount,
        windSpeed: Math.round(maxWindSpeed),
        weatherTypes: weatherTypes
    };
}

module.exports = getWeather;
