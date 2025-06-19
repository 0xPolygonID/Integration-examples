/**
 * builds key path
 *
 * @param {KmsKeyType} keyType - key type
 * @param {string} keyID - key id
 * @returns string path
 */
export function keyPath(keyType, keyID) {
    const basePath = '';
    return basePath + String(keyType) + ':' + keyID;
}
