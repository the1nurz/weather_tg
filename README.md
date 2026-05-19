# 🌤️ Weather Telegram Bot

Простий Telegram-бот, що дає прогноз погоди та радить що одягти.

## Що умів робити

- `/weather [місто]` - прогноз для міста
- `/subscribe [місто]` - отримувати прогноз кожного дня о 8:00
- `/unsubscribe` - відписатися
- Рекомендації щодо одягу залежно від температури та вітру
- Попередження про спеку (>30°C)

## Стек

- Node.js + Telegram Bot API
- OpenWeather API для даних про погоду
- Event Bus для логування
- Черга повідомлень з пріоритетом
- Кешування результатів на 30 хв

## Як запустити

1. `npm install`
2. Копіюємо `.env.example` в `.env` у папці `weather-bot`
3. Заповнюємо змінні:
   - `TELEGRAM_BOT_TOKEN` - від @BotFather в Telegram
   - `WEATHER_API_KEY` - з https://openweathermap.org
4. `npm start`

## Як це працює

- API OpenWeather дає дані про погоду
- EventBus логує усі дії (команди, помилки, гасла)
- Черга з пріоритетом робить так щоб бот не спамив Telegram
- Дані користувачів зберігаються в JSON файлі

## Структура

```
weather_tg/
├── bot.js
├── package.json
└── weather-bot/
    ├── services/weatherService.js
    ├── events/eventBus.js
    ├── queue/priorityQueue.js
    ├── utils/memoize.js
    └── users/users.json
```
