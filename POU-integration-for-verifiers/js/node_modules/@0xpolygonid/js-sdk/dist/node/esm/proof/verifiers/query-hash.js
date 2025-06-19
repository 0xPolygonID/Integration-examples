import { poseidon } from '@iden3/js-crypto';
import { defaultValueArraySize, prepareCircuitArrayValues } from '../../circuits';
export function calculateQueryHashV2(values, schema, slotIndex, operator, claimPathKey, claimPathNotExists) {
    const expValue = prepareCircuitArrayValues(values, 64);
    const valueHash = poseidon.spongeHashX(expValue, 6);
    return poseidon.hash([
        schema.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(claimPathNotExists),
        valueHash
    ]);
}
export function calculateQueryHashV3(values, schema, slotIndex, operator, claimPathKey, valueArraySize, merklized, isRevocationChecked, verifierID, nullifierSessionID) {
    const expValue = prepareCircuitArrayValues(values, defaultValueArraySize);
    const valueHash = poseidon.spongeHashX(expValue, 6);
    const firstPartQueryHash = poseidon.hash([
        schema.bigInt(),
        BigInt(slotIndex),
        BigInt(operator),
        BigInt(claimPathKey),
        BigInt(merklized),
        valueHash
    ]);
    const queryHash = poseidon.hash([
        firstPartQueryHash,
        BigInt(valueArraySize),
        BigInt(isRevocationChecked),
        BigInt(verifierID),
        BigInt(nullifierSessionID),
        0n
    ]);
    return queryHash;
}
