export declare class Param {
    name: string;
    value: string;
    constructor(name: string, value: string);
    toString(): string;
}
export interface IDID {
    method: string;
    id: string;
    idStrings: string[];
    params: Param[];
    path: string;
    pathSegments: string[];
    query: string;
    fragment: string;
}
export declare const initDIDParams: IDID;
