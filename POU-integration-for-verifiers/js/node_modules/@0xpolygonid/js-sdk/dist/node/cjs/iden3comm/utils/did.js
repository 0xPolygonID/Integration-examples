"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicKeyBytes = exports.resolveVerificationMethods = void 0;
const constants_1 = require("../constants");
const secp256k1_1 = require("@noble/curves/secp256k1");
const kms_1 = require("../../kms");
const utils_1 = require("../../utils");
const DIDAuthenticationSection = 'authentication';
const resolveVerificationMethods = (didDocument) => {
    const vms = didDocument.verificationMethod || [];
    // prioritize: first verification methods to be chosen are from `authentication` section.
    const sortedVerificationMethods = (didDocument[DIDAuthenticationSection] || [])
        .map((verificationMethod) => {
        if (typeof verificationMethod === 'string') {
            return vms.find((i) => i.id === verificationMethod);
        }
        return verificationMethod;
    })
        .filter((key) => key);
    // add all other verification methods
    for (let index = 0; index < vms.length; index++) {
        const id = vms[index].id;
        if (sortedVerificationMethods.findIndex((vm) => vm.id === id) === -1) {
            sortedVerificationMethods.push(vms[index]);
        }
    }
    return sortedVerificationMethods;
};
exports.resolveVerificationMethods = resolveVerificationMethods;
const extractPublicKeyBytes = (vm) => {
    const isSupportedVmType = Object.keys(constants_1.SUPPORTED_PUBLIC_KEY_TYPES).some((key) => constants_1.SUPPORTED_PUBLIC_KEY_TYPES[key].includes(vm.type));
    if (vm.publicKeyBase58 && isSupportedVmType) {
        return { publicKeyBytes: (0, utils_1.base58ToBytes)(vm.publicKeyBase58), kmsKeyType: kms_1.KmsKeyType.Secp256k1 };
    }
    if (vm.publicKeyBase64 && isSupportedVmType) {
        return {
            publicKeyBytes: (0, utils_1.base64UrlToBytes)(vm.publicKeyBase64),
            kmsKeyType: kms_1.KmsKeyType.Secp256k1
        };
    }
    if (vm.publicKeyHex && isSupportedVmType) {
        return { publicKeyBytes: (0, utils_1.hexToBytes)(vm.publicKeyHex), kmsKeyType: kms_1.KmsKeyType.Secp256k1 };
    }
    if (vm.publicKeyJwk &&
        vm.publicKeyJwk.crv === 'secp256k1' &&
        vm.publicKeyJwk.x &&
        vm.publicKeyJwk.y) {
        const [xHex, yHex] = [
            (0, utils_1.base64UrlToBytes)(vm.publicKeyJwk.x),
            (0, utils_1.base64UrlToBytes)(vm.publicKeyJwk.y)
        ].map(utils_1.bytesToHex);
        const x = xHex.includes('0x') ? BigInt(xHex) : BigInt(`0x${xHex}`);
        const y = yHex.includes('0x') ? BigInt(yHex) : BigInt(`0x${yHex}`);
        return {
            publicKeyBytes: secp256k1_1.secp256k1.ProjectivePoint.fromAffine({
                x,
                y
            }).toRawBytes(false),
            kmsKeyType: kms_1.KmsKeyType.Secp256k1
        };
    }
    return { publicKeyBytes: null };
};
exports.extractPublicKeyBytes = extractPublicKeyBytes;
