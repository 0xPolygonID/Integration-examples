"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sec256k1Provider = void 0;
const store_1 = require("../store");
const providerHelpers = __importStar(require("../provider-helpers"));
const utils_1 = require("../../utils");
const secp256k1_1 = require("@noble/curves/secp256k1");
const js_crypto_1 = require("@iden3/js-crypto");
const did_jwt_1 = require("did-jwt");
/**
 * Provider for Secp256k1
 * @public
 * @class Secp256k1Provider
 * @implements implements IKeyProvider interface
 */
class Sec256k1Provider {
    /**
     * Creates an instance of BjjProvider.
     * @param {KmsKeyType} keyType - kms key type
     * @param {AbstractPrivateKeyStore} keyStore - key store for kms
     */
    constructor(keyType, keyStore) {
        if (keyType !== store_1.KmsKeyType.Secp256k1) {
            throw new Error('Key type must be Secp256k1');
        }
        this.keyType = keyType;
        this._keyStore = keyStore;
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
     * generates a baby jub jub key from a seed phrase
     * @param {Uint8Array} seed - byte array seed
     * @returns kms key identifier
     */
    async newPrivateKeyFromSeed(seed) {
        if (seed.length !== 32) {
            throw new Error('Seed should be 32 bytes');
        }
        const publicKey = secp256k1_1.secp256k1.getPublicKey(seed);
        const kmsId = {
            type: this.keyType,
            id: providerHelpers.keyPath(this.keyType, (0, utils_1.bytesToHex)(publicKey))
        };
        await this._keyStore.importKey({
            alias: kmsId.id,
            key: (0, utils_1.bytesToHex)(seed).padStart(64, '0')
        });
        return kmsId;
    }
    /**
     * Gets public key by kmsKeyId
     *
     * @param {KmsKeyId} keyId - key identifier
     */
    async publicKey(keyId) {
        const privateKeyHex = await this.privateKey(keyId);
        const publicKey = secp256k1_1.secp256k1.getPublicKey(privateKeyHex, false); // 04 + x + y (uncompressed key)
        return (0, utils_1.bytesToHex)(publicKey);
    }
    /**
     * Signs the given data using the private key associated with the specified key identifier.
     * @param keyId - The key identifier to use for signing.
     * @param data - The data to sign.
     * @param opts - Signing options, such as the algorithm to use.
     * @returns A Promise that resolves to the signature as a Uint8Array.
     */
    async sign(keyId, data, opts = { alg: 'ES256K' }) {
        const privateKeyHex = await this.privateKey(keyId);
        const signatureBase64 = await (0, did_jwt_1.ES256KSigner)((0, did_jwt_1.hexToBytes)(privateKeyHex), opts.alg === 'ES256K-R')(data);
        if (typeof signatureBase64 !== 'string') {
            throw new Error('signatureBase64 must be a string');
        }
        return (0, utils_1.base64UrlToBytes)(signatureBase64);
    }
    /**
     * Verifies a signature for the given message and key identifier.
     * @param message - The message to verify the signature against.
     * @param signatureHex - The signature to verify, as a hexadecimal string.
     * @param keyId - The key identifier to use for verification.
     * @returns A Promise that resolves to a boolean indicating whether the signature is valid.
     */
    async verify(message, signatureHex, keyId) {
        const publicKeyHex = await this.publicKey(keyId);
        return secp256k1_1.secp256k1.verify(signatureHex, (0, js_crypto_1.sha256)(message), publicKeyHex);
    }
    async privateKey(keyId) {
        return this._keyStore.get({ alias: keyId.id });
    }
}
exports.Sec256k1Provider = Sec256k1Provider;
