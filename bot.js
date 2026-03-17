require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// 1. СПОЧАТКУ створюємо змінну з токеном і самого бота
const token = '8686955126:AAFFs5-N6CJ4YDH8mCnCa0IR_08D4HgIEa4'; 
const bot = new TelegramBot(token, {polling: true});

// 2. Тимчасова функція-заглушка для погоди (поки ми не підключили реальне API)
async function cachedWeather(city) {
    // Пізніше ми реалізуємо тут Task 3 (Мемоізацію) та запит до сервера погоди
    return {
        temp: 15,
        description: "мінлива хмарність (тестові дані)"
    };
}

// 3. ТІЛЬКИ ПОТІМ просимо бота слухати команди
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Привіт! Я погодний бот 🌤");
});

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1];

    // Отримуємо погоду з нашої функції
    const weather = await cachedWeather(city);

    bot.sendMessage(
        msg.chat.id,
        `🌤 Погода у ${city}\nТемпература: ${weather.temp}°C\nОпис: ${weather.description}`
    );
});

console.log("Бот успішно запущено! 🚀 Напишіть йому /start у Telegram.");