"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateQueryHashV3 = exports.calculateQueryHashV2 = void 0;
const js_crypto_1 = require("@iden3/js-crypto");
const circuits_1 = require("../../circuits");
function calculateQueryHashV2(values, schema, slotIndex, operator, claimPathKey, claimPathNotExists) {
    const expValue = (0, circuits_1.prepareCircuitArrayValues)(values, 64);
    const valueHash = js_crypto_1.poseidon.spongeHashX(expValue, 6);
    return js_crypto_1.poseidon.hash([
        schema.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(claimPathNotExists),
        valueHash
    ]);
}
exports.calculateQueryHashV2 = calculateQueryHashV2;
function calculateQueryHashV3(values, schema, slotIndex, operator, claimPathKey, valueArraySize, merklized, isRevocationChecked, verifierID, nullifierSessionID) {
    const expValue = (0, circuits_1.prepareCircuitArrayValues)(values, circuits_1.defaultValueArraySize);
    const valueHash = js_crypto_1.poseidon.spongeHashX(expValue, 6);
    const firstPartQueryHash = js_crypto_1.poseidon.hash([
        schema.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(merklized),
        valueHash
    ]);
    const queryHash = js_crypto_1.poseidon.hash([
        firstPartQueryHash,
        BigInt(valueArraySize),
        BigInt(isRevocationChecked),
        BigInt(verifierID),
        BigInt(nullifierSessionID),
        0n
    ]);
    return queryHash;
}
exports.calculateQueryHashV3 = calculateQueryHashV3;
