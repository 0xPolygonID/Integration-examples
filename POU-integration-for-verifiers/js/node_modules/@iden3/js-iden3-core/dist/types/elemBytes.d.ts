export declare class BytesHelper {
    static intToBytes(int: bigint): Uint8Array;
    static intToNBytes(int: bigint, n: number): Uint8Array;
    static checkChecksum(bytes: Uint8Array): boolean;
    static decomposeBytes(b: Uint8Array): {
        typ: Uint8Array;
        genesis: Uint8Array;
        checksum: Uint8Array;
    };
    static calculateChecksum(typ: Uint8Array, genesis: Uint8Array): Uint8Array;
    static hashBytes(str: string): Uint8Array;
    static hexToBytes(str: string): Uint8Array;
    static bytesToHex(bytes: Uint8Array): string;
    static bytesToInt(bytes: Uint8Array): bigint;
}
export declare class ElemBytes {
    private _bytes;
    constructor(bytes?: Uint8Array | null);
    get bytes(): Uint8Array;
    set bytes(value: Uint8Array);
    toBigInt(): bigint;
    setBigInt(n: bigint): ElemBytes;
    slotFromHex(hex: string): ElemBytes;
    hex(): string;
    static elemBytesToInts(elements: ElemBytes[]): bigint[];
    static fromInt(i: bigint): ElemBytes;
}
