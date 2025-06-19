import { CredentialStatusType } from '../../verifiable';
import { MessageBus, SDK_EVENTS } from '../../utils';
/**
 * Registry for managing credential status publishers.
 */
export class CredentialStatusPublisherRegistry {
    constructor() {
        this._publishers = new Map();
    }
    /**
     * Registers one or more credential status publishers for a given type.
     * @param type - The credential status type.
     * @param publisher - One or more credential status publishers.
     */
    register(type, ...publisher) {
        const publishers = this._publishers.get(type) ?? [];
        publishers.push(...publisher);
        this._publishers.set(type, publishers);
    }
    /**
     * Retrieves the credential status publishers for a given type.
     * @param type - The credential status type.
     * @returns An array of credential status publishers or undefined if none are registered for the given type.
     */
    get(type) {
        return this._publishers.get(type);
    }
}
/**
 * Implementation of the ICredentialStatusPublisher interface for publishing on-chain credential status.
 */
export class Iden3OnchainSmtCredentialStatusPublisher {
    constructor(_storage) {
        this._storage = _storage;
    }
    /**
     * Publishes the credential status to the blockchain.
     * @param params - The parameters for publishing the credential status.
     */
    async publish(params) {
        if (![CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023].includes(params.credentialStatusType)) {
            throw new Error(`On-chain publishing is not supported for credential status type ${params.credentialStatusType}`);
        }
        const nodesBigInts = params.nodes.map((n) => n.children.map((c) => c.bigInt()));
        const txPromise = this._storage.saveNodes(nodesBigInts);
        let publishMode = params.onChain?.publishMode ?? 'sync';
        if (params.onChain?.txCallback) {
            publishMode = 'callback';
        }
        switch (publishMode) {
            case 'sync':
                await txPromise;
                break;
            case 'callback': {
                if (!params.onChain?.txCallback) {
                    throw new Error('txCallback is required for publishMode "callback"');
                }
                const cb = params.onChain?.txCallback;
                txPromise.then((receipt) => cb(receipt));
                break;
            }
            case 'async': {
                const mb = MessageBus.getInstance();
                txPromise.then((receipt) => mb.publish(SDK_EVENTS.TX_RECEIPT_ACCEPTED, receipt));
                break;
            }
            default:
                throw new Error(`Invalid publishMode: ${publishMode}`);
        }
    }
}
/**
 * Implementation of the ICredentialStatusPublisher interface for publishing off-chain credential status.
 */
export class Iden3SmtRhsCredentialStatusPublisher {
    /**
     * Publishes the credential status to a specified node URL.
     * @param params - The parameters for publishing the credential status.
     * @param params.nodes - The proof nodes to be published.
     * @param params.rhsUrl - The URL of the node to publish the credential status to.
     * @returns A promise that resolves when the credential status is successfully published.
     * @throws An error if the publishing fails.
     */
    async publish(params) {
        if (![CredentialStatusType.Iden3ReverseSparseMerkleTreeProof].includes(params.credentialStatusType)) {
            throw new Error(`On-chain publishing is not supported for credential status type ${params.credentialStatusType}`);
        }
        const nodesJSON = params.nodes.map((n) => n.toJSON());
        const resp = await fetch(params.rhsUrl + '/node', {
            method: 'post',
            body: JSON.stringify(nodesJSON)
        });
        if (resp.status !== 200) {
            throw new Error(`Failed to publish credential status. Status: ${resp.status}`);
        }
    }
}
