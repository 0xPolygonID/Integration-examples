import { createStore, get, set, entries } from 'idb-keyval';
/**
 * Allows storing keys in the indexed db storage of the browser
 * (NOT ENCRYPTED: DO NOT USE IN THE PRODUCTION)
 *
 * @public
 * @class IndexedDBPrivateKeyStore
 * @implements implements AbstractPrivateKeyStore interface
 */
export class IndexedDBPrivateKeyStore {
    constructor() {
        this._store = createStore(`${IndexedDBPrivateKeyStore.storageKey}-db`, IndexedDBPrivateKeyStore.storageKey);
    }
    /**
     * get all keys
     *
     * @abstract
     * @returns `Promise<{ alias: string; key: string }[]>`
     */
    async list() {
        const allEntries = await entries(this._store);
        return allEntries.map(([alias, key]) => ({ alias, key: key.value }));
    }
    /**
     * Gets key from the indexed db storage
     *
     * @param {{ alias: string }} args
     * @returns hex string
     */
    async get(args) {
        const key = await get(args.alias, this._store);
        if (!key) {
            throw new Error('no key under given alias');
        }
        return key.value;
    }
    /**
     * Import key to the indexed db storage
     *
     * @param {{ alias: string; key: string }} args - alias and private key in the hex
     * @returns void
     */
    async importKey(args) {
        await set(args.alias, { value: args.key }, this._store);
    }
}
IndexedDBPrivateKeyStore.storageKey = 'keystore';
