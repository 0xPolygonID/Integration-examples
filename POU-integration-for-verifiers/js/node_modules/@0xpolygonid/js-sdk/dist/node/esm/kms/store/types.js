/**
 * Key type that can be used in the key management system
 *
 * @enum {number}
 */
export var KmsKeyType;
(function (KmsKeyType) {
    KmsKeyType["BabyJubJub"] = "BJJ";
    KmsKeyType["Secp256k1"] = "Secp256k1";
    KmsKeyType["Ed25519"] = "Ed25519";
})(KmsKeyType || (KmsKeyType = {}));
