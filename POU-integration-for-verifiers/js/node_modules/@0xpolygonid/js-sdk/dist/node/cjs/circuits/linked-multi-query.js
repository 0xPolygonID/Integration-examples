"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedMultiQueryPubSignals = exports.LinkedMultiQueryInputs = void 0;
const js_merkletree_1 = require("@iden3/js-merkletree");
const utils_1 = require("../utils");
const common_1 = require("./common");
const models_1 = require("./models");
/**
 * LinkedMultiQuery circuit representation
 * Inputs and public signals declaration, marshalling and parsing
 *
 * @beta
 * @class LinkedMultiQueryInputs
 */
class LinkedMultiQueryInputs extends common_1.BaseConfig {
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
                const valuesArr = (0, common_1.prepareCircuitArrayValues)([], this.getValueArrSize());
                value.push((0, common_1.bigIntArrayToStringArray)(valuesArr));
                valueArraySize.push(0);
                continue;
            }
            let valueProof = this.query[i].valueProof;
            if (!valueProof) {
                valueProof = new models_1.ValueProof();
                valueProof.path = 0n;
                valueProof.value = 0n;
                valueProof.mtp = new js_merkletree_1.Proof();
            }
            claimPathMtp.push((0, common_1.prepareSiblingsStr)(valueProof.mtp, this.getMTLevelsClaim()));
            const nodAuxJSONLD = (0, common_1.getNodeAuxValue)(valueProof.mtp);
            claimPathMtpNoAux.push(nodAuxJSONLD.noAux);
            claimPathMtpAuxHi.push(nodAuxJSONLD.key.bigInt().toString());
            claimPathMtpAuxHv.push(nodAuxJSONLD.value.bigInt().toString());
            claimPathKey.push(valueProof.path.toString());
            claimPathValue.push(valueProof.value.toString());
            slotIndex.push(this.query[i].slotIndex);
            operator.push(this.query[i].operator);
            valueArraySize.push(this.query[i].values.length);
            const valuesArr = (0, common_1.prepareCircuitArrayValues)(this.query[i].values, this.getValueArrSize());
            value.push((0, common_1.bigIntArrayToStringArray)(valuesArr));
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
        return utils_1.byteEncoder.encode(JSON.stringify(s));
    }
}
exports.LinkedMultiQueryInputs = LinkedMultiQueryInputs;
LinkedMultiQueryInputs.queryCount = 10;
// LinkedMultiQueryPubSignals linkedMultiQuery10.circom public signals
/**
 * public signals
 *
 * @beta
 * @class LinkedMultiQueryPubSignals
 */
class LinkedMultiQueryPubSignals {
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
        const sVals = JSON.parse(utils_1.byteDecoder.decode(data));
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
exports.LinkedMultiQueryPubSignals = LinkedMultiQueryPubSignals;
