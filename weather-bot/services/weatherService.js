const axios = require("axios");
require("dotenv").config();

async function getWeather(city) {
    const apiKey = process.env.WEATHER_API_KEY;

    const url =
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const res = await axios.get(url);

    return {
        temp: res.data.main.temp,
        description: res.data.weather[0].description
    };
}

module.exports = getWeather;
const memoize = require("./utils/memoize");
const getWeather = require("./services/weatherService");

const cachedWeather = memoize(getWeather, 1800000);