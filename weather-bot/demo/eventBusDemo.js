const { EventBus } = require("../events/eventBus");

function runDemo() {
    const bus = new EventBus();

    const notifyUser = (message) => {
        console.log(`User notification: ${message.city} is ${message.temperature}C`);
    };

    const logWeather = (message) => {
        console.log(`Weather log: ${message.city} -> ${message.description}`);
    };

    const unsubscribeUser = bus.subscribe("weather.updated", notifyUser);
    bus.subscribe("weather.updated", logWeather);

    console.log("Listeners before unsubscribe:", bus.listenerCount("weather.updated"));

    bus.publish("weather.updated", {
        city: "Kyiv",
        temperature: 23,
        description: "clear sky"
    });

    unsubscribeUser();

    console.log("Listeners after unsubscribe:", bus.listenerCount("weather.updated"));

    bus.publish("weather.updated", {
        city: "Lviv",
        temperature: 18,
        description: "light rain"
    });
}

if (require.main === module) {
    runDemo();
}

module.exports = {
    runDemo
};
