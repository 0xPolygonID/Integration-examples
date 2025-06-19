export declare class Id {
    private _bytes;
    private readonly _checksum;
    constructor(typ: Uint8Array, genesis: Uint8Array);
    private static getFromBytes;
    checksum(): Uint8Array;
    string(): string;
    get bytes(): Uint8Array;
    set bytes(b: Uint8Array);
    type(): Uint8Array;
    bigInt(): bigint;
    equal(id: Id): boolean;
    marshal(): Uint8Array;
    static unMarshal(b: Uint8Array): Id;
    static fromBytes(b: Uint8Array): Id;
    static fromString(s: string): Id;
    static fromBigInt(bigInt: bigint): Id;
    static profileId(id: Id, nonce: bigint): Id;
    static idGenesisFromIdenState(typ: Uint8Array, //nolint:revive
    state: bigint): Id;
    static ethAddressFromId(id: Id): Uint8Array;
}
