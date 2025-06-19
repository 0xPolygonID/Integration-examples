import { Proof } from '@iden3/js-merkletree';
import { byteDecoder, byteEncoder } from '../utils';
import { BaseConfig, bigIntArrayToStringArray, getNodeAuxValue, prepareCircuitArrayValues, prepareSiblingsStr } from './common';
import { ValueProof } from './models';
/**
 * LinkedMultiQuery circuit representation
 * Inputs and public signals declaration, marshalling and parsing
 *
 * @beta
 * @class LinkedMultiQueryInputs
 */
export class LinkedMultiQueryInputs extends BaseConfig {
    // InputsMarshal returns Circom private inputs for linkedMultiQueryInputs.circom
    inputsMarshal() {
        const claimPathMtp = [];
        const claimPathMtpNoAux = [];
        const claimPathMtpAuxHi = [];
        const claimPathMtpAuxHv = [];
        const claimPathKey = [];
        const claimPathValue = [];
        const slotIndex = [];
        const operator = [];
        const value = [];
        const valueArraySize = [];
        for (let i = 0; i < LinkedMultiQueryInputs.queryCount; i++) {
            if (!this.query[i]) {
                claimPathMtp.push(new Array(this.getMTLevelsClaim()).fill('0'));
                claimPathMtpNoAux.push('0');
                claimPathMtpAuxHi.push('0');
                claimPathMtpAuxHv.push('0');
                claimPathKey.push('0');
                claimPathValue.push('0');
                slotIndex.push(0);
                operator.push(0);
                const valuesArr = prepareCircuitArrayValues([], this.getValueArrSize());
                value.push(bigIntArrayToStringArray(valuesArr));
                valueArraySize.push(0);
                continue;
            }
            let valueProof = this.query[i].valueProof;
            if (!valueProof) {
                valueProof = new ValueProof();
                valueProof.path = 0n;
                valueProof.value = 0n;
                valueProof.mtp = new Proof();
            }
            claimPathMtp.push(prepareSiblingsStr(valueProof.mtp, this.getMTLevelsClaim()));
            const nodAuxJSONLD = getNodeAuxValue(valueProof.mtp);
            claimPathMtpNoAux.push(nodAuxJSONLD.noAux);
            claimPathMtpAuxHi.push(nodAuxJSONLD.key.bigInt().toString());
            claimPathMtpAuxHv.push(nodAuxJSONLD.value.bigInt().toString());
            claimPathKey.push(valueProof.path.toString());
            claimPathValue.push(valueProof.value.toString());
            slotIndex.push(this.query[i].slotIndex);
            operator.push(this.query[i].operator);
            valueArraySize.push(this.query[i].values.length);
            const valuesArr = prepareCircuitArrayValues(this.query[i].values, this.getValueArrSize());
            value.push(bigIntArrayToStringArray(valuesArr));
        }
        const s = {
            linkNonce: this.linkNonce.toString(),
            issuerClaim: this.claim.marshalJson(),
            claimSchema: this.claim.getSchemaHash().bigInt().toString(),
            claimPathMtp,
            claimPathMtpNoAux,
            claimPathMtpAuxHi,
            claimPathMtpAuxHv,
            claimPathKey,
            claimPathValue,
            slotIndex,
            operator,
            value,
            valueArraySize
        };
        return byteEncoder.encode(JSON.stringify(s));
    }
}
LinkedMultiQueryInputs.queryCount = 10;
// LinkedMultiQueryPubSignals linkedMultiQuery10.circom public signals
/**
 * public signals
 *
 * @beta
 * @class LinkedMultiQueryPubSignals
 */
export class LinkedMultiQueryPubSignals {
    /**
     * PubSignalsUnmarshal unmarshal linkedMultiQuery10.circom public inputs to LinkedMultiQueryPubSignals
     *
     * @beta
     * @param {Uint8Array} data
     * @returns LinkedMultiQueryPubSignals
     */
    pubSignalsUnmarshal(data) {
        const len = 22;
        const queryLength = LinkedMultiQueryInputs.queryCount;
        const sVals = JSON.parse(byteDecoder.decode(data));
        if (sVals.length !== len) {
            throw new Error(`invalid number of Output values expected ${len} got ${sVals.length}`);
        }
        let fieldIdx = 0;
        // -- linkID
        this.linkID = BigInt(sVals[fieldIdx]);
        fieldIdx++;
        // -- merklized
        this.merklized = parseInt(sVals[fieldIdx]);
        fieldIdx++;
        // - operatorOutput
        this.operatorOutput = [];
        for (let i = 0; i < queryLength; i++) {
            this.operatorOutput.push(BigInt(sVals[fieldIdx]));
            fieldIdx++;
        }
        // - circuitQueryHash
        this.circuitQueryHash = [];
        for (let i = 0; i < queryLength; i++) {
            this.circuitQueryHash.push(BigInt(sVals[fieldIdx]));
            fieldIdx++;
        }
        return this;
    }
}
