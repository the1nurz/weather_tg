require("dotenv").config({ path: "./weather-bot/.env" });
const TelegramBot = require("node-telegram-bot-api");
const memoize = require("./weather-bot/utils/memoize");
const getWeather = require("./weather-bot/services/weatherService");
const PriorityQueue = require("./weather-bot/queue/priorityQueue");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new TelegramBot(token, { polling: true });
const cachedWeather = memoize(getWeather, 1800000);
const queue = new PriorityQueue();

function addToQueue(chatId, text, priority) {
    queue.enqueue({
        chatId: chatId,
        text: text
    }, priority || 0)
}

setInterval(async () => {
    if (!queue.isEmpty()) {
        let message = queue.dequeue("highest")

        try {
            await bot.sendMessage(message.chatId, message.text)
        } catch (e) {
            console.log("send error")
        }
    }
}, 200)

bot.onText(/\/start/, (msg) => {
    addToQueue(
        msg.chat.id,
        "Привіт! Я погодний бот. Напиши /weather Київ",
        1
    )
});

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1].trim();

    try {
        const weather = await cachedWeather(city);

        addToQueue(
            msg.chat.id,
            `Погода у ${city}\nТемпература: ${weather.temp}°C\nОпис: ${weather.description}`,
            7
        )
    } catch (error) {
        addToQueue(
            msg.chat.id,
            `Не вдалося отримати погоду для "${city}". Перевір назву міста і спробуй ще раз.`,
            7
        )
    }
});

console.log("Бот успішно запущено! Напишіть йому /start у Telegram.");
