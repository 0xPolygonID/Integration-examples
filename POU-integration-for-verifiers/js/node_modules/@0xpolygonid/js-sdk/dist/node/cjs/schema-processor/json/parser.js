"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const verifiable_1 = require("../../verifiable");
const jsonld = __importStar(require("jsonld/lib"));
const ldcontext = __importStar(require("jsonld/lib/context"));
/**
 * Parser can parse claim and schema data according to specification
 *
 * @public
 * @class Parser
 */
class Parser {
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
        return (0, verifiable_1.findCredentialType)(mz);
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
        return (0, verifiable_1.getSerializationAttrFromContext)(context, opts, tp);
    }
    /**
     * @deprecated The method should not be used. Use getSerializationAttrFromParsedContext from verifiable.
     *
     * */
    static async getSerializationAttrFromParsedContext(ldCtx, tp) {
        return (0, verifiable_1.getSerializationAttrFromParsedContext)(ldCtx, tp);
    }
    /**
     * @deprecated The method should not be used. Use parseSerializationAttr from verifiable.
     *
     */
    static parseSerializationAttr(serAttr) {
        return (0, verifiable_1.parseSerializationAttr)(serAttr);
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
        return (0, verifiable_1.parseCoreClaimSlots)(ldCtx, mz, credentialType);
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
        return (0, verifiable_1.getFieldSlotIndex)(field, typeName, schemaBytes);
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
exports.Parser = Parser;
