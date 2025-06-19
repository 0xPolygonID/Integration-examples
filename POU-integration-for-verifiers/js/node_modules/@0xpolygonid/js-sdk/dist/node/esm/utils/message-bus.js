import PubSub from 'pubsub-js';
export const SDK_EVENTS = {
    TX_RECEIPT_ACCEPTED: 'TX_RECEIPT_ACCEPTED'
};
/**
 * Represents a message bus that allows publishing and subscribing to topics.
 */
export class MessageBus {
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
        return PubSub.publish(topic.toString(), data);
    }
    /**
     * Subscribes to a specific topic and registers a callback function to be executed when a message is published.
     *
     * @param topic - The topic to subscribe to.
     * @param callback - The callback function to be executed when a message is published.
     */
    subscribe(topic, callback) {
        return PubSub.subscribe(topic.toString(), (_, data) => callback(data));
    }
    /**
     * Subscribes to a specific topic and registers a callback function to be executed when a message is published.
     * The callback function is executed only once.
     *
     * @param topic - The topic to subscribe to.
     * @param callback - The callback function to be executed when a message is published.
     */
    subscribeOnce(topic, callback) {
        PubSub.subscribeOnce(topic.toString(), (_, data) => callback(data));
    }
    /**
     * Unsubscribes from a specific topic in the message bus.
     *
     * @param topic - The topic to unsubscribe from.
     * @returns A string or boolean indicating the success of the unsubscribe operation.
     */
    unsubscribe(topic) {
        return PubSub.unsubscribe(topic.toString());
    }
}
