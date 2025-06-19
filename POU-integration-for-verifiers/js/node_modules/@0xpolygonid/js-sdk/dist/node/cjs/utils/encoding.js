"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytesToHex = exports.decodeBase64url = exports.encodeBase64url = exports.hexToBytes = exports.bytesToBase58 = exports.base58ToBytes = exports.base64UrlToBytes = exports.bytesToBase64 = exports.base64ToBytes = exports.bytesToBase64url = exports.byteDecoder = exports.byteEncoder = void 0;
const js_crypto_1 = require("@iden3/js-crypto");
const rfc4648_1 = require("rfc4648");
exports.byteEncoder = new TextEncoder();
exports.byteDecoder = new TextDecoder();
function bytesToBase64url(b, opts = { pad: false }) {
    return rfc4648_1.base64url.stringify(b, opts);
}
exports.bytesToBase64url = bytesToBase64url;
function base64ToBytes(s, opts = { loose: true }) {
    return rfc4648_1.base64.parse(s, opts);
}
exports.base64ToBytes = base64ToBytes;
function bytesToBase64(b, opts = { pad: false }) {
    return rfc4648_1.base64.stringify(b, opts);
}
exports.bytesToBase64 = bytesToBase64;
function base64UrlToBytes(s, opts = { loose: true }) {
    const inputBase64Url = s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return rfc4648_1.base64url.parse(inputBase64Url, opts);
}
exports.base64UrlToBytes = base64UrlToBytes;
function base58ToBytes(s) {
    return (0, js_crypto_1.base58ToBytes)(s);
}
exports.base58ToBytes = base58ToBytes;
function bytesToBase58(b) {
    return (0, js_crypto_1.base58FromBytes)(b);
}
exports.bytesToBase58 = bytesToBase58;
function hexToBytes(s) {
    const input = s.startsWith('0x') ? s.substring(2) : s;
    return js_crypto_1.Hex.decodeString(input.toLowerCase());
}
exports.hexToBytes = hexToBytes;
function encodeBase64url(s, opts = { pad: false }) {
    return rfc4648_1.base64url.stringify(exports.byteEncoder.encode(s), opts);
}
exports.encodeBase64url = encodeBase64url;
function decodeBase64url(s, opts = { loose: true }) {
    return exports.byteDecoder.decode(rfc4648_1.base64url.parse(s, opts));
}
exports.decodeBase64url = decodeBase64url;
function bytesToHex(b) {
    return js_crypto_1.Hex.encodeString(b);
}
exports.bytesToHex = bytesToHex;
