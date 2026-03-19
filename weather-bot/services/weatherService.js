const axios = require("axios");

async function getWeather(city) {
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
        throw new Error("WEATHER_API_KEY is not set");
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ua`;
    const res = await axios.get(url);

    return {
        temp: res.data.main.temp,
        description: res.data.weather[0].description
    };
}

module.exports = getWeather;
