import { getSerializationAttrFromContext, parseSerializationAttr, getFieldSlotIndex, findCredentialType, getSerializationAttrFromParsedContext, parseCoreClaimSlots } from '../../verifiable';
import * as jsonld from 'jsonld/lib';
import * as ldcontext from 'jsonld/lib/context';
/**
 * Parser can parse claim and schema data according to specification
 *
 * @public
 * @class Parser
 */
export class Parser {
    /**
     *  @deprecated The method should not be used. Use credential.toCoreClaim instead.
     *  ParseClaim creates core.Claim object from W3CCredential
     *
     * @param {W3CCredential} credential - Verifiable Credential
     * @param {CoreClaimOptions} [opts] - options to parse core claim
     * @returns `Promise<CoreClaim>`
     */
    static async parseClaim(credential, opts) {
        return credential.toCoreClaim(opts);
    }
    /**
     * @deprecated The method should not be used. Use findCredentialType from verifiable.
     */
    static findCredentialType(mz) {
        return findCredentialType(mz);
    }
    /**
     *  @deprecated The method should not be used. Use credential.getSerializationAttr instead.
     *
     *  Get `iden3_serialization` attr definition from context document either using
     *  type name like DeliverAddressMultiTestForked or by type id like
     *  urn:uuid:ac2ede19-b3b9-454d-b1a9-a7b3d5763100.
     *  */
    static async getSerializationAttr(credential, opts, tp) {
        const ldCtx = await jsonld.processContext(ldcontext.getInitialContext({}), credential['@context'], opts);
        return Parser.getSerializationAttrFromParsedContext(ldCtx, tp);
    }
    /**
     * @deprecated The method should not be used. Use getSerializationAttrFromContext from verifiable.
     *
     *  Get `iden3_serialization` attr definition from context document either using
     *  type name like DeliverAddressMultiTestForked or by type id like
     *  urn:uuid:ac2ede19-b3b9-454d-b1a9-a7b3d5763100.
     *
     */
    static async getSerializationAttrFromContext(context, opts, tp) {
        return getSerializationAttrFromContext(context, opts, tp);
    }
    /**
     * @deprecated The method should not be used. Use getSerializationAttrFromParsedContext from verifiable.
     *
     * */
    static async getSerializationAttrFromParsedContext(ldCtx, tp) {
        return getSerializationAttrFromParsedContext(ldCtx, tp);
    }
    /**
     * @deprecated The method should not be used. Use parseSerializationAttr from verifiable.
     *
     */
    static parseSerializationAttr(serAttr) {
        return parseSerializationAttr(serAttr);
    }
    /**
     *
     * @deprecated The method should not be used. Use credential.parseSlots instead.
     * ParseSlots converts payload to claim slots using provided schema
     *
     * @param {Merklizer} mz - Merklizer
     * @param {W3CCredential} credential - Verifiable Credential
     * @param {string} credentialType - credential type
     * @returns `ParsedSlots`
     */
    static async parseSlots(mz, credential, credentialType) {
        const ldCtx = await jsonld.processContext(ldcontext.getInitialContext({}), credential['@context'], mz.options);
        return parseCoreClaimSlots(ldCtx, mz, credentialType);
    }
    /**
     * @deprecated The method should not be used. Use getFieldSlotIndex from verifiable.
     *
     * GetFieldSlotIndex return index of slot from 0 to 7 (each claim has by default 8 slots) for non-merklized claims
     *
     * @param {string} field - field name
     * @param {Uint8Array} schemaBytes -json schema bytes
     * @returns `number`
     */
    static async getFieldSlotIndex(field, typeName, schemaBytes) {
        return getFieldSlotIndex(field, typeName, schemaBytes);
    }
    /**
     * ExtractCredentialSubjectProperties return credential subject types from JSON schema
     *
     * @param {string | JSON} schema - JSON schema
     * @returns `Promise<Array<string>>`
     */
    static async extractCredentialSubjectProperties(schema) {
        const parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
        const props = parsedSchema.properties?.credentialSubject?.properties;
        if (!props) {
            throw new Error('properties.credentialSubject.properties is not set');
        }
        // drop @id field
        delete props['id'];
        return Object.keys(props);
    }
}
