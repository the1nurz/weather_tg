require("dotenv").config({ path: "./weather-bot/.env" });

const fs = require("fs");
const path = require("path");
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
const usersFile = path.join(__dirname, "weather-bot", "users", "users.json");

const dailyHour = 8;
const dailyMinute = 0;

function addToQueue(chatId, text, priority) {
    queue.enqueue({
        chatId: chatId,
        text: text
    }, priority || 0);
}

function loadUsers() {
    try {
        const text = fs.readFileSync(usersFile, "utf8");

        if (!text.trim()) {
            return [];
        }

        return JSON.parse(text);
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function makeDailyMessage(city, weather) {
    let advice = "Одягайся по погоді.";

    if (weather.temp <= 0) {
        advice = "Одягни теплу куртку, шапку і рукавички.";
    } else if (weather.temp <= 10) {
        advice = "Краще одягнути куртку або теплий светр.";
    } else if (weather.temp <= 20) {
        advice = "Підійде легка куртка або кофта.";
    } else {
        advice = "Можна одягнутися легко.";
    }

    const description = weather.description.toLowerCase();
    const isRain = description.includes("дощ") || description.includes("rain");
    const rainText = isRain
        ? "Схоже, буде дощ. Візьми парасольку."
        : "Дощу в описі погоди немає.";

    return `Добрий ранок!
Прогноз на сьогодні для ${city}
Температура: ${weather.temp}°C
Опис: ${weather.description}
${rainText}
Порада: ${advice}`;
}

setInterval(async () => {
    if (!queue.isEmpty()) {
        const message = queue.dequeue("highest");

        try {
            await bot.sendMessage(message.chatId, message.text);
        } catch (error) {
            console.log("send error");
        }
    }
}, 200);

setInterval(async () => {
    const now = new Date();

    if (now.getHours() !== dailyHour || now.getMinutes() !== dailyMinute) {
        return;
    }

    const today = getToday();
    const users = loadUsers();

    for (let i = 0; i < users.length; i += 1) {
        const user = users[i];

        if (user.lastSentDate === today) {
            continue;
        }

        try {
            const weather = await cachedWeather(user.city);
            const text = makeDailyMessage(user.city, weather);

            addToQueue(user.chatId, text, 5);
            user.lastSentDate = today;
        } catch (error) {
            addToQueue(user.chatId, `Не вдалося отримати прогноз для ${user.city}.`, 5);
        }
    }

    saveUsers(users);
}, 60000);

bot.onText(/\/start/, (msg) => {
    addToQueue(
        msg.chat.id,
        "Привіт! Я погодний бот.\nНапиши /weather Київ, щоб отримати погоду.\nНапиши /subscribe Київ, щоб отримувати прогноз кожного дня о 08:00.",
        1
    );
});

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1].trim();

    try {
        const weather = await cachedWeather(city);

        addToQueue(
            msg.chat.id,
            `Погода у ${city}\nТемпература: ${weather.temp}°C\nОпис: ${weather.description}`,
            7
        );
    } catch (error) {
        addToQueue(
            msg.chat.id,
            `Не вдалося отримати погоду для "${city}". Перевір назву міста і спробуй ще раз.`,
            7
        );
    }
});

bot.onText(/\/subscribe (.+)/, (msg, match) => {
    const city = match[1].trim();
    const users = loadUsers();
    let userFound = false;

    for (let i = 0; i < users.length; i += 1) {
        if (users[i].chatId === msg.chat.id) {
            users[i].city = city;
            users[i].lastSentDate = "";
            userFound = true;
        }
    }

    if (!userFound) {
        users.push({
            chatId: msg.chat.id,
            city: city,
            lastSentDate: ""
        });
    }

    saveUsers(users);
    addToQueue(msg.chat.id, `Готово! Тепер щодня о 08:00 надсилатиму прогноз для ${city}.`, 7);
});

bot.onText(/\/unsubscribe/, (msg) => {
    const users = loadUsers();
    const newUsers = [];

    for (let i = 0; i < users.length; i += 1) {
        if (users[i].chatId !== msg.chat.id) {
            newUsers.push(users[i]);
        }
    }

    saveUsers(newUsers);
    addToQueue(msg.chat.id, "Готово! Щоденну розсилку вимкнено.", 7);
});

console.log("Бот успішно запущено! Напишіть йому /start у Telegram.");
