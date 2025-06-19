import * as providerHelpers from '../provider-helpers';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '../../utils';
/**
 * Provider for Ed25519 keys
 * @public
 * @class Ed25519Provider
 * @implements IKeyProvider interface
 */
export class Ed25519Provider {
    /**
     * Creates an instance of Ed25519Provider.
     * @param {KmsKeyType} keyType - kms key type
     * @param {AbstractPrivateKeyStore} keyStore - key store for kms
     */
    constructor(keyType, _keyStore) {
        this.keyType = keyType;
        this._keyStore = _keyStore;
    }
    /**
     * get all keys
     * @returns list of keys
     */
    async list() {
        const allKeysFromKeyStore = await this._keyStore.list();
        return allKeysFromKeyStore.filter((key) => key.alias.startsWith(this.keyType));
    }
    /**
     * generates a ed25519 key from a seed phrase
     * @param {Uint8Array} seed - byte array seed
     * @returns {Promise<KmsKeyId>} kms key identifier
     */
    async newPrivateKeyFromSeed(seed) {
        if (seed.length !== 32) {
            throw new Error('Seed should be 32 bytes');
        }
        const publicKey = ed25519.getPublicKey(seed);
        const kmsId = {
            type: this.keyType,
            id: providerHelpers.keyPath(this.keyType, bytesToHex(publicKey))
        };
        await this._keyStore.importKey({
            alias: kmsId.id,
            key: bytesToHex(seed)
        });
        return kmsId;
    }
    /**
     * Gets public key by kmsKeyId
     * @param {KmsKeyId} keyId - key identifier
     * @returns {Promise<string>} Public key as a hex string
     */
    async publicKey(keyId) {
        const privateKeyHex = await this.privateKey(keyId);
        const publicKey = ed25519.getPublicKey(privateKeyHex);
        return bytesToHex(publicKey);
    }
    /**
     * signs prepared payload of size,
     * with a key id
     * @param {KmsKeyId} keyId  - key identifier
     * @param {Uint8Array} digest - data to sign (32 bytes)
     * @returns {Promise<Uint8Array>} signature
     */
    async sign(keyId, digest) {
        const privateKeyHex = await this.privateKey(keyId);
        return ed25519.sign(digest, privateKeyHex);
    }
    /**
     * Verifies a signature for the given message and key identifier.
     * @param digest - The message to verify the signature against.
     * @param signatureHex - The signature to verify, as a hexadecimal string.
     * @param keyId - The key identifier to use for verification.
     * @returns A Promise that resolves to a boolean indicating whether the signature is valid.
     */
    async verify(digest, signatureHex, keyId) {
        const publicKeyHex = await this.publicKey(keyId);
        return ed25519.verify(signatureHex, digest, publicKeyHex);
    }
    /**
     * Retrieves the private key for a given keyId from the key store.
     * @param {KmsKeyId} keyId - The identifier of the key to retrieve.
     * @returns {Promise<string>} The private key associated with the keyId.
     */
    async privateKey(keyId) {
        return this._keyStore.get({ alias: keyId.id });
    }
}
