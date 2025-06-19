export declare class SchemaHash {
    static readonly authSchemaHash: SchemaHash;
    private _bytes;
    /**
     * Constructor
     * @param bytes
     */
    constructor(bytes?: Uint8Array);
    get bytes(): Uint8Array;
    /**
     * MarshalText returns HEX representation of SchemaHash.
     * @returns {Uint8Array} 32 bytes//
     */
    marshalTextBytes(): Uint8Array;
    marshalText(): string;
    /**
     * NewSchemaHashFromHex creates new SchemaHash from hex string
     * @param s
     * @returns {SchemaHash}
     */
    static newSchemaHashFromHex(s: string): SchemaHash;
    /**
     * NewSchemaHashFromInt creates new SchemaHash from big.Int
     * @param i
     * @returns
     */
    static newSchemaHashFromInt(i: bigint): SchemaHash;
    /**
     * Convert SchemaHash to big.Int
     * @returns {bigint}
     */
    bigInt(): bigint;
}
