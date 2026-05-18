require("dotenv").config({ path: "./weather-bot/.env" });

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const memoize = require("./weather-bot/utils/memoize");
const getWeather = require("./weather-bot/services/weatherService");
const PriorityQueue = require("./weather-bot/queue/priorityQueue");
const { EventBus } = require("./weather-bot/events/eventBus");
const { WEATHER_UPDATED } = require("./weather-bot/events/weatherEntities");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не встановлено");
}

const bot = new TelegramBot(token, { polling: true });
const cachedWeather = memoize(getWeather, 1800000);
const queue = new PriorityQueue();
const eventBus = new EventBus();
const usersFile = path.join(__dirname, "weather-bot", "users", "users.json");

const dailyHour = 8;
const dailyMinute = 0;

function addToQueue(chatId, text, priority) {
    queue.enqueue({
        chatId: chatId,
        text: text
    }, priority || 0);

    eventBus.publish("queue.message.added", {
        chatId: chatId,
        priority: priority || 0,
        textLength: text.length
    });
}

function registerBotEventListeners() {
    const unsubscribeCommandLogger = eventBus.subscribe("bot.command.received", (message) => {
        console.log(`Отримано команду: ${message.command} від чату ${message.chatId}`);
    });

    const unsubscribeQueueLogger = eventBus.subscribe("queue.message.added", (message) => {
        console.log(`Повідомлення для чату ${message.chatId} додано в чергу з пріоритетом ${message.priority}`);
    });

    const unsubscribeWeatherLogger = eventBus.subscribe(WEATHER_UPDATED, (message) => {
        console.log(`Подія погоди: ${message.city}, ${message.temperature}C, ${message.description}`);
    });

    const unsubscribeSubscriptionLogger = eventBus.subscribe("subscription.changed", (message) => {
        const actionText = {
            created: "створено",
            updated: "оновлено",
            deleted: "видалено"
        }[message.action] || message.action;

        console.log(`Підписку ${actionText} для чату ${message.chatId}`);
    });

    const unsubscribeHeatAlert = eventBus.subscribe(WEATHER_UPDATED, (message) => {
        if (message.temperature < 30) {
            return;
        }

        addToQueue(
            message.chatId,
            `Попередження про спеку для ${message.city}: ${message.temperature}°C. Пий воду і уникай прямого сонця.`,
            8
        );
    });

    return () => {
        unsubscribeCommandLogger();
        unsubscribeQueueLogger();
        unsubscribeWeatherLogger();
        unsubscribeSubscriptionLogger();
        unsubscribeHeatAlert();
    };
}

const stopBotEventListeners = registerBotEventListeners();

function shutdown() {
    stopBotEventListeners();
    bot.stopPolling();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

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
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
    } catch (error) {
        console.log("Не вдалося зберегти користувачів");
    }
}

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getRainAdvice(weather) {
    if (!weather.willRain && weather.rainChance < 20) {
        return "☀️ Дощу не буде.";
    }

    if (weather.rainChance >= 20 && weather.rainChance < 40) {
        return `🌧️ Невелика ймовірність дощу (${weather.rainChance}%). Парасолька за бажанням.`;
    }

    if (weather.rainChance >= 40 && weather.rainChance < 70) {
        return `⛈️ Дощ можливий (${weather.rainChance}% ймовірності). Краще взяти парасольку.`;
    }

    return `⛈️ Очікується дощ (${weather.rainChance}% ймовірності). Парасолька необхідна!`;
}

function getWindAdvice(weather) {
    if (weather.windSpeed < 5) {
        return "Вітер слабкий, комфортно.";
    }

    if (weather.windSpeed < 10) {
        return `Помірний вітер ${weather.windSpeed} м/с. Майте на увазі при прогулянці.`;
    }

    if (weather.windSpeed < 15) {
        return `Вітер ${weather.windSpeed} м/с. Сильний вітер — важко ходити. Захисті волосся.`;
    }

    return `Дуже сильний вітер ${weather.windSpeed} м/с! Ризик прогулювань на вулиці.`;
}

function getFeelsLikeAdvice(weather) {
    const feelsLikeTemp = Math.round((weather.maxFeelsLike + weather.minFeelsLike) / 2);

    if (feelsLikeTemp <= -20) {
        return `Відчувається як ${feelsLikeTemp}°C — дуже холодно, довгих прогулянок уникати!`;
    }

    if (feelsLikeTemp <= -10) {
        return `Відчувається як ${feelsLikeTemp}°C — холодно, обмежити час на вулиці.`;
    }

    if (feelsLikeTemp <= 0) {
        return `Відчувається як ${feelsLikeTemp}°C через вітер і вологість.`;
    }

    return "";
}

function getClothingAdvice(weather) {
    const realTemp = weather.minTemp;
    const feelsLikeTemp = weather.minFeelsLike;
    const isWet = weather.willRain || weather.rainChance >= 40;
    const isWindy = weather.windSpeed >= 10;

    if (realTemp >= 25) {
        if (isWet) {
            return "Легкий одяг, парасолька. Можна навіть футболку в дощ.";
        }
        return "Легкий одяг, сонцезахисні окуляри. Неймовірно комфортно!";
    }

    if (realTemp >= 18) {
        if (isWindy && isWet) {
            return "Легка куртка, парасолька. Закритий одяг бажаний.";
        }
        if (isWet) {
            return "Легка куртка або светр + парасолька.";
        }
        return "Легка куртка або кофта. Комфортно гуляти.";
    }

    if (realTemp >= 10) {
        if (isWindy && isWet) {
            return "Теплий светр або демісезонна куртка + парасолька. Закрити шию та вуха.";
        }
        if (isWet) {
            return "Демісезонна куртка + парасолька.";
        }
        if (isWindy) {
            return "Теплий світер або легка куртка. Вітер — обмоти шию.";
        }
        return "Легка куртка або теплий светр.";
    }

    if (realTemp >= 0) {
        if (isWet) {
            return "Зимова куртка, парасолька. Рукавички розумні — дощ скуповує мокру снігову кашу.";
        }
        return "Зимова куртка, можна без шапки, але краще мати при собі.";
    }

    return "Теплий пуховик, шапка, рукавички обов'язково! Утеплюйтеся!";
}


function makeDailyMessage(city, weather) {
    const rainAdvice = getRainAdvice(weather);
    const windAdvice = getWindAdvice(weather);
    const feelsLikeAdvice = getFeelsLikeAdvice(weather);
    const clothingAdvice = getClothingAdvice(weather);

    let message = `🌍 Прогноз для ${city}\n\n`;

    message += `🌡️ ТЕМПЕРАТУРА\n`;
    message += `Середня: ${weather.temp}°C\n`;
    message += `Мінімальна: ${weather.minTemp}°C`;

    if (weather.minFeelsLike < weather.minTemp) {
        message += ` (відчувається ${weather.minFeelsLike}°C)`;
    }

    message += `\n`;
    message += `Максимальна: ${weather.maxTemp}°C`;

    if (weather.maxFeelsLike > weather.maxTemp) {
        message += ` (відчувається ${weather.maxFeelsLike}°C)`;
    }

    message += `\n`;
    if (feelsLikeAdvice) {
        message += `⚠️ ${feelsLikeAdvice}\n`;
    }
    message += `\n`;

    message += `💧 ВОЛОГІСТЬ ТА ДОЩ\n`;
    message += `${rainAdvice}\n\n`;

    message += `💨 ВІТЕР\n`;
    message += `Макс швидкість: ${weather.windSpeed} м/с\n`;
    message += `${windAdvice}\n\n`;

    message += `📝 ОПИС\n${weather.description}\n\n`;

    message += `👕 ЩО ОДЯГТИ\n`;
    message += `${clothingAdvice}`;

    return message;
}

setInterval(async () => {
    if (!queue.isEmpty()) {
        const message = queue.dequeue("highest");

        try {
            await bot.sendMessage(message.chatId, message.text);
        } catch (error) {
            console.log("Помилка надсилання повідомлення");
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
            const text = `Добрий ранок!\n${makeDailyMessage(user.city, weather)}`;

            eventBus.publish(WEATHER_UPDATED, {
                chatId: user.chatId,
                city: user.city,
                temperature: weather.maxTemp,
                description: weather.description,
                source: "daily-subscription"
            });

            addToQueue(user.chatId, text, 5);
            user.lastSentDate = today;
        } catch (error) {
            addToQueue(user.chatId, `Не вдалося отримати прогноз для ${user.city}.`, 5);
        }
    }

    saveUsers(users);
}, 60000);

bot.onText(/\/start/, (msg) => {
    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/start"
    });

    addToQueue(
        msg.chat.id,
        "Привіт! Я погодний бот.\nНапиши /weather Київ, щоб отримати денний прогноз.\nНапиши /subscribe Київ, щоб отримувати денний прогноз кожного дня о 08:00.",
        1
    );
});

bot.onText(/^\/weather$/, (msg) => {
    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/weather"
    });

    addToQueue(
        msg.chat.id,
        "Напиши місто після команди. Наприклад: /weather Київ",
        7
    );
});

bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1].trim();

    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/weather",
        city: city
    });

    try {
        const weather = await cachedWeather(city);

        eventBus.publish(WEATHER_UPDATED, {
            chatId: msg.chat.id,
            city: city,
            temperature: weather.maxTemp,
            description: weather.description,
            source: "manual-request"
        });

        addToQueue(msg.chat.id, makeDailyMessage(city, weather), 7);
    } catch (error) {
        addToQueue(
            msg.chat.id,
            `Не вдалося отримати прогноз для "${city}". Перевір назву міста і спробуй ще раз.`,
            7
        );
    }
});

bot.onText(/^\/subscribe$/, (msg) => {
    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/subscribe"
    });

    addToQueue(
        msg.chat.id,
        "Напиши місто для підписки. Наприклад: /subscribe Київ",
        7
    );
});

bot.onText(/\/subscribe (.+)/, (msg, match) => {
    const city = match[1].trim();
    const users = loadUsers();
    let userFound = false;

    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/subscribe",
        city: city
    });

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
    eventBus.publish("subscription.changed", {
        action: userFound ? "updated" : "created",
        chatId: msg.chat.id,
        city: city
    });

    addToQueue(msg.chat.id, `Готово! Тепер щодня о 08:00 надсилатиму денний прогноз для ${city}.`, 7);
});

bot.onText(/\/unsubscribe/, (msg) => {
    const users = loadUsers();
    const newUsers = [];

    eventBus.publish("bot.command.received", {
        chatId: msg.chat.id,
        command: "/unsubscribe"
    });

    for (let i = 0; i < users.length; i += 1) {
        if (users[i].chatId !== msg.chat.id) {
            newUsers.push(users[i]);
        }
    }

    saveUsers(newUsers);
    eventBus.publish("subscription.changed", {
        action: "deleted",
        chatId: msg.chat.id
    });

    addToQueue(msg.chat.id, "Готово! Щоденну розсилку вимкнено.", 7);
});

console.log("Бот успішно запущено! Напишіть йому /start у Telegram.");
