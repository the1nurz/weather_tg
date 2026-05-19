## Функціонал
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

## Логування та декоратор
- Додано `weather-bot/utils/logDecorator.js` для обгортання синхронних та асинхронних функцій.
- Підтримка рівнів: `DEBUG`, `INFO`, `WARN`, `ERROR`.
- Можна логувати в консоль, файл або передати зовнішню функцію.
- Приклад використання в `weather-bot/demo/logDecoratorDemo.js`.

## Як це працює
- API OpenWeather дає дані про погоду
- EventBus логує усі дії (команди, помилки, гасла)
- Черга з пріоритетом робить так щоб бот не спамив Telegram
- Дані користувачів зберігаються в JSON файлі

## Завдання
- Task 1: Generators and Iterators — частково представлено через async-ітератори в `weather-bot/demo/largeDataDemo.js`
- Task 2: Project Setup — `.gitignore`, `package.json`, `weather-bot/package.json`
- Task 3: Memoization — `weather-bot/utils/memoize.js`
- Task 4: Bi-Directional Priority Queue — `weather-bot/queue/priorityQueue.js`
- Task 5: Async Array Function Variants — `weather-bot/utils/asyncFilterMap.js`, `weather-bot/demo/asyncFilterMapDemo.js`
- Task 6: Large Data Processing with Streams/Async Iterators — `weather-bot/demo/largeDataDemo.js`
- Task 7: Reactive Communication with EventEmitters — `weather-bot/events/eventBus.js`, `weather-bot/demo/eventBusDemo.js`, `weather-bot/events/weatherEntities.js`
- Task 8: Authentication Proxy for an API Service — `weather-bot/services/authProxy.js`, `weather-bot/demo/authProxyDemo.js`
- Task 9: Logging Decorator with Configurable Log Levels — `weather-bot/utils/logDecorator.js`, `weather-bot/demo/logDecoratorDemo.js`
