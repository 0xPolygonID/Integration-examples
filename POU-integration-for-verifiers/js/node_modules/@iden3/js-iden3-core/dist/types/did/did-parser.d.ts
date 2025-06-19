import { IDID } from './types';
type ParserStep = () => ParserStep | null;
export declare class Parser {
    private readonly input;
    currentIndex: number;
    out: IDID;
    constructor(input: string);
    checkLength(): ParserStep | null;
    parseScheme(): ParserStep | null;
    parseMethod(): ParserStep | null;
    parseId(): ParserStep | null;
    parseParamName(): ParserStep | null;
    parseParamValue(): ParserStep | null;
    paramTransition(): ParserStep | null;
    parsePath(): ParserStep | null;
    parseQuery(): ParserStep | null;
    parseFragment(): ParserStep | null;
}
export {};
