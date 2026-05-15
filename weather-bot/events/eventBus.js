const EventEmitter = require("events");

class EventBus {
    constructor() {
        this.emitter = new EventEmitter();
    }

    subscribe(eventName, listener) {
        this.emitter.on(eventName, listener);

        return () => {
            this.unsubscribe(eventName, listener);
        };
    }

    subscribeOnce(eventName, listener) {
        this.emitter.once(eventName, listener);

        return () => {
            this.unsubscribe(eventName, listener);
        };
    }

    unsubscribe(eventName, listener) {
        this.emitter.off(eventName, listener);
    }

    publish(eventName, message) {
        this.emitter.emit(eventName, message);
    }

    listenerCount(eventName) {
        return this.emitter.listenerCount(eventName);
    }
}

module.exports = {
    EventBus
};
