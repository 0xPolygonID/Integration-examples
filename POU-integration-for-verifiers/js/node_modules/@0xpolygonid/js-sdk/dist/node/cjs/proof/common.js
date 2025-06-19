"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformQueryValueToBigInts = exports.parseQueriesMetadata = exports.parseQueryMetadata = exports.parseCredentialSubject = exports.toGISTProof = exports.toClaimNonRevStatus = void 0;
const js_merkletree_1 = require("@iden3/js-merkletree");
const circuits_1 = require("../circuits");
const verifiable_1 = require("../verifiable");
const js_jsonld_merklization_1 = require("@iden3/js-jsonld-merklization");
const utils_1 = require("../utils");
const js_crypto_1 = require("@iden3/js-crypto");
/**
 * converts verifiable RevocationStatus model to circuits structure
 *
 * @param {RevocationStatus} - credential.status of the verifiable credential
 * @returns {ClaimNonRevStatus}
 */
const toClaimNonRevStatus = (s) => {
    if (!s) {
        const hash = js_crypto_1.poseidon.hash(new Array(3).fill(0n));
        return {
            proof: new js_merkletree_1.Proof(),
            treeState: {
                state: js_merkletree_1.Hash.fromBigInt(hash),
                claimsRoot: js_merkletree_1.ZERO_HASH,
                revocationRoot: js_merkletree_1.ZERO_HASH,
                rootOfRoots: js_merkletree_1.ZERO_HASH
            }
        };
    }
    return {
        proof: s.mtp,
        treeState: (0, circuits_1.buildTreeState)(s.issuer.state, s.issuer.claimsTreeRoot, s.issuer.revocationTreeRoot, s.issuer.rootOfRoots)
    };
};
exports.toClaimNonRevStatus = toClaimNonRevStatus;
/**
 * converts state info from smart contract to gist proof
 *
 * @param {StateProof} smtProof  - state proof from smart contract
 * @returns {GISTProof}
 */
const toGISTProof = (smtProof) => {
    let existence = false;
    let nodeAux;
    if (smtProof.existence) {
        existence = true;
    }
    else {
        if (smtProof.auxExistence) {
            nodeAux = {
                key: js_merkletree_1.Hash.fromBigInt(smtProof.auxIndex),
                value: js_merkletree_1.Hash.fromBigInt(smtProof.auxValue)
            };
        }
    }
    const allSiblings = smtProof.siblings.map((s) => js_merkletree_1.Hash.fromBigInt(s));
    const proof = new js_merkletree_1.Proof({ siblings: allSiblings, nodeAux: nodeAux, existence: existence });
    const root = js_merkletree_1.Hash.fromBigInt(smtProof.root);
    return {
        root,
        proof
    };
};
exports.toGISTProof = toGISTProof;
const parseCredentialSubject = (credentialSubject) => {
    // credentialSubject is empty
    if (!credentialSubject) {
        return [{ operator: circuits_1.QueryOperators.$noop, fieldName: '' }];
    }
    const queries = [];
    const entries = Object.entries(credentialSubject);
    if (!entries.length) {
        throw new Error(`query must have at least 1 predicate`);
    }
    for (const [fieldName, fieldReq] of entries) {
        const fieldReqEntries = Object.entries(fieldReq);
        const isSelectiveDisclosure = fieldReqEntries.length === 0;
        if (isSelectiveDisclosure) {
            queries.push({ operator: circuits_1.QueryOperators.$sd, fieldName: fieldName });
            continue;
        }
        for (const [operatorName, operatorValue] of fieldReqEntries) {
            if (!circuits_1.QueryOperators[operatorName]) {
                throw new Error(`operator is not supported by lib`);
            }
            const operator = circuits_1.QueryOperators[operatorName];
            queries.push({ operator, fieldName, operatorValue });
        }
    }
    return queries;
};
exports.parseCredentialSubject = parseCredentialSubject;
const parseQueryMetadata = async (propertyQuery, ldContextJSON, credentialType, options) => {
    const query = {
        ...propertyQuery,
        slotIndex: 0,
        merklizedSchema: false,
        datatype: '',
        claimPathKey: BigInt(0),
        values: [],
        path: new js_jsonld_merklization_1.Path()
    };
    if (!propertyQuery.fieldName && propertyQuery.operator !== circuits_1.Operators.NOOP) {
        throw new Error('query must have a field name if operator is not $noop');
    }
    if (propertyQuery.fieldName) {
        query.datatype = await js_jsonld_merklization_1.Path.newTypeFromContext(ldContextJSON, `${credentialType}.${propertyQuery.fieldName}`, options);
    }
    const serAttr = await (0, verifiable_1.getSerializationAttrFromContext)(JSON.parse(ldContextJSON), options, credentialType);
    if (!serAttr) {
        query.merklizedSchema = true;
    }
    // for merklized credentials slotIndex in query must be equal to zero
    // and not a position of merklization root.
    // it has no influence on check in the off-chain circuits, but it aligns with onchain verification standard
    if (!query.merklizedSchema) {
        query.slotIndex = await (0, verifiable_1.getFieldSlotIndex)(propertyQuery.fieldName, credentialType, utils_1.byteEncoder.encode(ldContextJSON));
    }
    else {
        try {
            const path = await (0, verifiable_1.buildFieldPath)(ldContextJSON, credentialType, propertyQuery.fieldName, options);
            query.claimPathKey = await path.mtEntry();
            query.path = path;
        }
        catch (e) {
            throw new Error(`field does not exist in the schema ${e.message}`);
        }
    }
    if (propertyQuery.operatorValue !== undefined) {
        if (!(0, circuits_1.isValidOperation)(query.datatype, propertyQuery.operator)) {
            throw new Error(`operator ${propertyQuery.operator} is not supported for datatype ${query.datatype}`);
        }
        if ((propertyQuery.operator === circuits_1.Operators.NOOP || propertyQuery.operator === circuits_1.Operators.SD) &&
            propertyQuery.operatorValue) {
            throw new Error(`operator value should be undefined for ${propertyQuery.operator} operator`);
        }
        let values;
        switch (propertyQuery.operator) {
            case circuits_1.Operators.NOOP:
            case circuits_1.Operators.SD:
                values = [];
                break;
            case circuits_1.Operators.EXISTS:
                values = transformExistsValue(propertyQuery.operatorValue);
                break;
            default:
                values = await (0, exports.transformQueryValueToBigInts)(propertyQuery.operatorValue, query.datatype);
        }
        query.values = values;
    }
    return query;
};
exports.parseQueryMetadata = parseQueryMetadata;
const parseQueriesMetadata = async (credentialType, ldContextJSON, credentialSubject, options) => {
    const queriesMetadata = (0, exports.parseCredentialSubject)(credentialSubject);
    return Promise.all(queriesMetadata.map((m) => (0, exports.parseQueryMetadata)(m, ldContextJSON, credentialType, options)));
};
exports.parseQueriesMetadata = parseQueriesMetadata;
const transformQueryValueToBigInts = async (value, ldType) => {
    const values = [];
    if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
            values[index] = await js_jsonld_merklization_1.Merklizer.hashValue(ldType, value[index]);
        }
    }
    else {
        values[0] = await js_jsonld_merklization_1.Merklizer.hashValue(ldType, value);
    }
    return values;
};
exports.transformQueryValueToBigInts = transformQueryValueToBigInts;
const transformExistsValue = (value) => {
    if (typeof value == 'boolean') {
        return [BigInt(value)];
    }
    throw new Error('exists operator value must be true or false');
};
