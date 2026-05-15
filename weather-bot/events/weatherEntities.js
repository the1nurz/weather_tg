const WEATHER_UPDATED = "weather.updated";

class WeatherStation {
    constructor(eventBus, stationName) {
        this.eventBus = eventBus;
        this.stationName = stationName;
    }

    report(weather) {
        this.eventBus.publish(WEATHER_UPDATED, {
            ...weather,
            stationName: this.stationName,
            reportedAt: new Date().toISOString()
        });
    }
}

class UserNotifier {
    constructor(eventBus, userName) {
        this.eventBus = eventBus;
        this.userName = userName;
        this.unsubscribe = null;
    }

    start() {
        this.unsubscribe = this.eventBus.subscribe(WEATHER_UPDATED, (message) => {
            console.log(
                `Notification for ${this.userName}: ${message.city} is ${message.temperature}C`
            );
        });
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

class WeatherLogger {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.unsubscribe = null;
    }

    start() {
        this.unsubscribe = this.eventBus.subscribe(WEATHER_UPDATED, (message) => {
            console.log(
                `Log: ${message.stationName} reported ${message.city} -> ${message.description}`
            );
        });
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

class HeatAlertService {
    constructor(eventBus, limit) {
        this.eventBus = eventBus;
        this.limit = limit;
        this.unsubscribe = null;
    }

    start() {
        this.unsubscribe = this.eventBus.subscribe(WEATHER_UPDATED, (message) => {
            if (message.temperature >= this.limit) {
                console.log(`Heat alert: ${message.city} reached ${message.temperature}C`);
            }
        });
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

module.exports = {
    HeatAlertService,
    UserNotifier,
    WEATHER_UPDATED,
    WeatherLogger,
    WeatherStation
};
