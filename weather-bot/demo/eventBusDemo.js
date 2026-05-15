const { EventBus } = require("../events/eventBus");
const {
    HeatAlertService,
    UserNotifier,
    WEATHER_UPDATED,
    WeatherLogger,
    WeatherStation
} = require("../events/weatherEntities");

function runDemo() {
    const bus = new EventBus();

    const station = new WeatherStation(bus, "Kyiv Central Station");
    const notifier = new UserNotifier(bus, "Olena");
    const logger = new WeatherLogger(bus);
    const heatAlertService = new HeatAlertService(bus, 25);

    notifier.start();
    logger.start();
    heatAlertService.start();

    console.log("Listeners before unsubscribe:", bus.listenerCount(WEATHER_UPDATED));

    station.report({
        city: "Kyiv",
        temperature: 23,
        description: "clear sky"
    });

    notifier.stop();

    console.log("Listeners after unsubscribe:", bus.listenerCount(WEATHER_UPDATED));

    station.report({
        city: "Lviv",
        temperature: 28,
        description: "hot afternoon"
    });
}

if (require.main === module) {
    runDemo();
}

module.exports = {
    runDemo
};
