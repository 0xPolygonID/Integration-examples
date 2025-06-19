"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyPath = void 0;
/**
 * builds key path
 *
 * @param {KmsKeyType} keyType - key type
 * @param {string} keyID - key id
 * @returns string path
 */
function keyPath(keyType, keyID) {
    const basePath = '';
    return basePath + String(keyType) + ':' + keyID;
}
exports.keyPath = keyPath;
