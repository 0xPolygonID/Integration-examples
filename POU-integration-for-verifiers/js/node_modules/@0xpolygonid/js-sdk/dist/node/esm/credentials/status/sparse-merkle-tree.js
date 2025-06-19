import { Proof } from '@iden3/js-merkletree';
/**
 * IssuerResolver is a class that allows to interact with the issuer's http endpoint to get revocation status.
 *
 * @public
 * @class IssuerResolver
 */
export class IssuerResolver {
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
        return toRevocationStatus(revStatus);
    }
}
/**
 * toRevocationStatus is a result of fetching credential status with type SparseMerkleTreeProof converts to RevocationStatus
 *
 * @param {RevocationStatusResponse} { issuer, mtp }
 * @returns {RevocationStatus} RevocationStatus
 */
export const toRevocationStatus = ({ issuer, mtp }) => {
    return {
        mtp: Proof.fromJSON(mtp),
        issuer
    };
};
