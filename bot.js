require("dotenv").config({ path: "./weather-bot/.env" });
const TelegramBot = require("node-telegram-bot-api");
const memoize = require("./weather-bot/utils/memoize");
const getWeather = require("./weather-bot/services/weatherService");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new TelegramBot(token, { polling: true });
const cachedWeather = memoize(getWeather, 1800000);

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Привіт! Я погодний бот. Напиши /weather Київ");
});

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1].trim();

    try {
        const weather = await cachedWeather(city);

        bot.sendMessage(
            msg.chat.id,
            `Погода у ${city}\nТемпература: ${weather.temp}°C\nОпис: ${weather.description}`
        );
    } catch (error) {
        bot.sendMessage(
            msg.chat.id,
            `Не вдалося отримати погоду для "${city}". Перевір назву міста і спробуй ще раз.`
        );
    }
});

console.log("Бот успішно запущено! Напишіть йому /start у Telegram.");
