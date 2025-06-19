"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRevocationStatus = exports.IssuerResolver = void 0;
const js_merkletree_1 = require("@iden3/js-merkletree");
/**
 * IssuerResolver is a class that allows to interact with the issuer's http endpoint to get revocation status.
 *
 * @public
 * @class IssuerResolver
 */
class IssuerResolver {
    /**
     * resolve is a method to resolve a credential status directly from the issuer.
     *
     * @public
     * @param {CredentialStatus} credentialStatus -  credential status to resolve
     * @param {CredentialStatusResolveOptions} credentialStatusResolveOptions -  options for resolver
     * @returns `{Promise<RevocationStatus>}`
     */
    async resolve(credentialStatus) {
        const revStatusResp = await fetch(credentialStatus.id);
        const revStatus = await revStatusResp.json();
        return (0, exports.toRevocationStatus)(revStatus);
    }
}
exports.IssuerResolver = IssuerResolver;
/**
 * toRevocationStatus is a result of fetching credential status with type SparseMerkleTreeProof converts to RevocationStatus
 *
 * @param {RevocationStatusResponse} { issuer, mtp }
 * @returns {RevocationStatus} RevocationStatus
 */
const toRevocationStatus = ({ issuer, mtp }) => {
    return {
        mtp: js_merkletree_1.Proof.fromJSON(mtp),
        issuer
    };
};
exports.toRevocationStatus = toRevocationStatus;
