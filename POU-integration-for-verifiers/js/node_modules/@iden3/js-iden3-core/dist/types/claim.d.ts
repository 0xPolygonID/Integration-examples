import { SchemaHash } from './schemaHash';
import { ElemBytes } from './elemBytes';
import { Id } from './id';
export declare enum SlotName {
    IndexA = "IndexA",
    IndexB = "IndexB",
    ValueA = "ValueA",
    ValueB = "ValueB"
}
export declare class ErrSlotOverflow extends Error {
    constructor(msg: string);
}
export declare enum SubjectFlag {
    Self = 0,
    Invalid = 1,
    OtherIdenIndex = 2,
    OtherIdenValue = 3
}
export declare enum IdPosition {
    None = 0,
    Index = 1,
    Value = 2
}
export declare enum MerklizedFlag {
    None = 0,
    Index = 32,
    Value = 64,
    Invalid = 128
}
export declare enum MerklizedRootPosition {
    None = 0,
    Index = 1,
    Value = 2
}
export declare enum Flags {
    ByteIdx = 16,
    ExpirationBitIdx = 3,
    UpdatableBitIdx = 4
}
export declare class Claim {
    private _index;
    private _value;
    constructor();
    static newClaim(sh: SchemaHash, ...args: ClaimOption[]): Claim;
    getSchemaHash(): SchemaHash;
    get value(): ElemBytes[];
    set value(value: ElemBytes[]);
    get index(): ElemBytes[];
    set index(value: ElemBytes[]);
    setSchemaHash(sh: SchemaHash): void;
    setSubject(s: SubjectFlag): void;
    private getSubject;
    private setFlagExpiration;
    private getFlagExpiration;
    getIdPosition(): IdPosition;
    setValueDataInts(slotA: bigint | null, slotB: bigint | null): void;
    setValueDataBytes(slotA: Uint8Array, slotB: Uint8Array): void;
    setValueData(slotA: ElemBytes, slotB: ElemBytes): void;
    setIndexDataInts(slotA: bigint | null, slotB: bigint | null): void;
    setIndexDataBytes(slotA: Uint8Array | null, slotB: Uint8Array | null): void;
    private setSlotBytes;
    setFlagMerklized(s: MerklizedRootPosition): void;
    private getMerklized;
    getMerklizedPosition(): MerklizedRootPosition;
    setSlotInt(value: bigint | null, slotName: SlotName): ElemBytes;
    setIndexData(slotA: ElemBytes, slotB: ElemBytes): void;
    resetExpirationDate(): void;
    getExpirationDate(): Date | null;
    setExpirationDate(dt: Date): void;
    getRevocationNonce(): bigint;
    setRevocationNonce(nonce: bigint): void;
    getValueId(): Id;
    setValueId(id: Id): void;
    private resetIndexId;
    private resetValueId;
    getIndexId(): Id;
    setIndexId(id: Id): void;
    setVersion(ver: number): void;
    getVersion(): number;
    setFlagUpdatable(val: boolean): void;
    hIndex(): bigint;
    getFlagUpdatable(): boolean;
    hValue(): bigint;
    hiHv(): {
        hi: bigint;
        hv: bigint;
    };
    setIndexMerklizedRoot(r: bigint): void;
    resetIndexMerklizedRoot(): void;
    setValueMerklizedRoot(r: bigint): void;
    resetValueMerklizedRoot(): void;
    getMerklizedRoot(): bigint;
    resetId(): void;
    getId(): Id;
    rawSlots(): {
        index: ElemBytes[];
        value: ElemBytes[];
    };
    rawSlotsAsInts(): bigint[];
    clone(): Claim;
    marshalJson(): string[];
    unMarshalJson(b: string): Claim;
    marshalBinary(): Uint8Array;
    hex(): string;
    fromHex(hex: string): Claim;
    unMarshalBinary(data: Uint8Array): void;
}
export type ClaimOption = (c: Claim) => void;
export declare class ClaimOptions {
    static withFlagUpdatable(val: boolean): ClaimOption;
    static withVersion(ver: number): ClaimOption;
    static withIndexId(id: Id): ClaimOption;
    static withValueId(id: Id): ClaimOption;
    static withFlagMerklized(p: MerklizedRootPosition): ClaimOption;
    static withId(id: Id, pos: IdPosition): ClaimOption;
    static withRevocationNonce(nonce: bigint): ClaimOption;
    static withExpirationDate(dt: Date): ClaimOption;
    static withIndexData(slotA: ElemBytes, slotB: ElemBytes): ClaimOption;
    static withIndexDataBytes(slotA: Uint8Array | null, slotB: Uint8Array | null): ClaimOption;
    static withIndexDataInts(slotA: bigint | null, slotB: bigint | null): ClaimOption;
    static withValueData(slotA: ElemBytes, slotB: ElemBytes): ClaimOption;
    static withValueDataBytes(slotA: Uint8Array, slotB: Uint8Array): ClaimOption;
    static withValueDataInts(slotA: bigint | null, slotB: bigint | null): ClaimOption;
    static withIndexMerklizedRoot(r: bigint): ClaimOption;
    static withValueMerklizedRoot(r: bigint): ClaimOption;
    static withMerklizedRoot(r: bigint, pos: MerklizedRootPosition): ClaimOption;
}
