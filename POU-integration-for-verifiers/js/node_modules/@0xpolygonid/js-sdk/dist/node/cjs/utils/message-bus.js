"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBus = exports.SDK_EVENTS = void 0;
const pubsub_js_1 = __importDefault(require("pubsub-js"));
exports.SDK_EVENTS = {
    TX_RECEIPT_ACCEPTED: 'TX_RECEIPT_ACCEPTED'
};
/**
 * Represents a message bus that allows publishing and subscribing to topics.
 */
class MessageBus {
    /**
     * Private constructor for the MessageBus class.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    /**
     * Returns the singleton instance of the MessageBus class.
     * If the instance doesn't exist, it creates a new one.
     * @returns The singleton instance of the MessageBus class.
     */
    static getInstance() {
        // If the instance doesn't exist, create it
        if (!MessageBus.instance) {
            MessageBus.instance = new MessageBus();
        }
        // Return the instance
        return MessageBus.instance;
    }
    /**
     * Publishes a message to the specified topic.
     *
     * @template T - The type of data being published.
     * @param {SdkTopic} topic - The topic to publish the message to.
     * @param {T} data - The data to be published.
     * @returns {boolean} - Returns true if the message was successfully published, false otherwise.
     */
    publish(topic, data) {
        return pubsub_js_1.default.publish(topic.toString(), data);
    }
    /**
     * Subscribes to a specific topic and registers a callback function to be executed when a message is published.
     *
     * @param topic - The topic to subscribe to.
     * @param callback - The callback function to be executed when a message is published.
     */
    subscribe(topic, callback) {
        return pubsub_js_1.default.subscribe(topic.toString(), (_, data) => callback(data));
    }
    /**
     * Subscribes to a specific topic and registers a callback function to be executed when a message is published.
     * The callback function is executed only once.
     *
     * @param topic - The topic to subscribe to.
     * @param callback - The callback function to be executed when a message is published.
     */
    subscribeOnce(topic, callback) {
        pubsub_js_1.default.subscribeOnce(topic.toString(), (_, data) => callback(data));
    }
    /**
     * Unsubscribes from a specific topic in the message bus.
     *
     * @param topic - The topic to unsubscribe from.
     * @returns A string or boolean indicating the success of the unsubscribe operation.
     */
    unsubscribe(topic) {
        return pubsub_js_1.default.unsubscribe(topic.toString());
    }
}
exports.MessageBus = MessageBus;
