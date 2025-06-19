/**
 * Represents the XSD namespace and its corresponding data types.
 */
export var XSDNS;
(function (XSDNS) {
    XSDNS["Boolean"] = "http://www.w3.org/2001/XMLSchema#boolean";
    XSDNS["Integer"] = "http://www.w3.org/2001/XMLSchema#integer";
    XSDNS["NonNegativeInteger"] = "http://www.w3.org/2001/XMLSchema#nonNegativeInteger";
    XSDNS["NonPositiveInteger"] = "http://www.w3.org/2001/XMLSchema#nonPositiveInteger";
    XSDNS["NegativeInteger"] = "http://www.w3.org/2001/XMLSchema#negativeInteger";
    XSDNS["PositiveInteger"] = "http://www.w3.org/2001/XMLSchema#positiveInteger";
    XSDNS["DateTime"] = "http://www.w3.org/2001/XMLSchema#dateTime";
    XSDNS["Double"] = "http://www.w3.org/2001/XMLSchema#double";
    XSDNS["String"] = "http://www.w3.org/2001/XMLSchema#string";
})(XSDNS || (XSDNS = {}));
/**
 * List of available operators.
 *
 * @enum {number}
 */
export var Operators;
(function (Operators) {
    Operators[Operators["NOOP"] = 0] = "NOOP";
    Operators[Operators["EQ"] = 1] = "EQ";
    Operators[Operators["LT"] = 2] = "LT";
    Operators[Operators["GT"] = 3] = "GT";
    Operators[Operators["IN"] = 4] = "IN";
    Operators[Operators["NIN"] = 5] = "NIN";
    Operators[Operators["NE"] = 6] = "NE";
    Operators[Operators["LTE"] = 7] = "LTE";
    Operators[Operators["GTE"] = 8] = "GTE";
    Operators[Operators["BETWEEN"] = 9] = "BETWEEN";
    Operators[Operators["NONBETWEEN"] = 10] = "NONBETWEEN";
    Operators[Operators["EXISTS"] = 11] = "EXISTS";
    Operators[Operators["SD"] = 16] = "SD";
    Operators[Operators["NULLIFY"] = 17] = "NULLIFY";
})(Operators || (Operators = {}));
/** QueryOperators represents operators for atomic circuits */
export const QueryOperators = {
    $noop: Operators.NOOP,
    $eq: Operators.EQ,
    $lt: Operators.LT,
    $gt: Operators.GT,
    $in: Operators.IN,
    $nin: Operators.NIN,
    $ne: Operators.NE,
    $lte: Operators.LTE,
    $gte: Operators.GTE,
    $between: Operators.BETWEEN,
    $nonbetween: Operators.NONBETWEEN,
    $exists: Operators.EXISTS,
    $sd: Operators.SD,
    $nullify: Operators.NULLIFY
};
export const getOperatorNameByValue = (operator) => {
    const ops = Object.entries(QueryOperators).find(([, queryOp]) => queryOp === operator);
    return ops ? ops[0] : 'unknown';
};
const allOperations = Object.values(QueryOperators);
export const availableTypesOperators = new Map([
    [
        XSDNS.Boolean,
        [QueryOperators.$eq, QueryOperators.$ne, QueryOperators.$sd, QueryOperators.$exists]
    ],
    [XSDNS.Integer, allOperations],
    [XSDNS.NonNegativeInteger, allOperations],
    [XSDNS.PositiveInteger, allOperations],
    [
        XSDNS.Double,
        [
            QueryOperators.$eq,
            QueryOperators.$ne,
            QueryOperators.$in,
            QueryOperators.$nin,
            QueryOperators.$sd,
            QueryOperators.$exists
        ]
    ],
    [
        XSDNS.String,
        [
            QueryOperators.$eq,
            QueryOperators.$ne,
            QueryOperators.$in,
            QueryOperators.$nin,
            QueryOperators.$sd,
            QueryOperators.$exists
        ]
    ],
    [XSDNS.DateTime, allOperations]
]);
/**
 * Checks if the given operation is valid for the specified datatype.
 * @param datatype - The datatype to check the operation for.
 * @param op - The operation to check.
 * @returns True if the operation is valid, false otherwise.
 */
export const isValidOperation = (datatype, op) => {
    if (op === Operators.NOOP) {
        return true;
    }
    if (!availableTypesOperators.has(datatype)) {
        return false;
    }
    const ops = availableTypesOperators.get(datatype);
    if (!ops) {
        return false;
    }
    return ops.includes(op);
};
/**
 * Scalar is used to compare two scalar value.
 *
 * @public
 * @class Scalar
 * @implements implements IComparer interface
 */
export class Scalar {
    /**
     * Creates an instance of Scalar.
     * @param {bigint} x - val x
     * @param {bigint} y - val y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * compares two  scalar values
     *
     * @param {Operators} operator - EQ / LT / GT
     * @returns boolean
     */
    compare(operator) {
        switch (operator) {
            case Operators.EQ:
                return this.x === this.y;
            case Operators.LT:
                return this.x < this.y;
            case Operators.GT:
                return this.x > this.y;
            case Operators.NE:
                return this.x !== this.y;
            default:
                throw new Error('unknown compare type for scalar');
        }
    }
}
/**
 * Vector uses for find/not find x scalar type in y vector type.
 *
 * @public
 * @class Vector
 * @implements implements IComparer interface
 */
export class Vector {
    /**
     * Creates an instance of Vector.
     * @param {bigint} x - val x
     * @param {bigint[]} y - array values y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     *
     *
     * @param {Operators} operator - IN / NIN
     * @returns boolean
     */
    compare(operator) {
        switch (operator) {
            case Operators.IN:
                return this.y.includes(this.x);
            case Operators.NIN:
                return !this.y.includes(this.x);
            case Operators.BETWEEN:
                if (this.y.length !== 2) {
                    return false;
                }
                return this.x >= this.y[0] && this.x <= this.y[1];
            case Operators.NONBETWEEN:
                if (this.y.length !== 2) {
                    return false;
                }
                return this.x < this.y[0] || this.x > this.y[1];
            default:
                throw new Error('unknown compare type for vector');
        }
    }
}
/**
 * FactoryComparer depends on input data will return right comparer.
 *
 * @param {bigint} x - val x
 * @param {bigint[]} y - array of values y
 * @param {Operators} operator - EQ / LT / GT / IN / NIN
 * @returns IComparer
 */
export const factoryComparer = (x, y, operator) => {
    switch (operator) {
        case Operators.EQ:
        case Operators.LT:
        case Operators.GT:
        case Operators.NE:
            if (y.length !== 1) {
                throw new Error('currently we support only one value for scalar comparison');
            }
            return new Scalar(x, y[0]);
        case Operators.IN:
        case Operators.NIN:
        case Operators.BETWEEN:
        case Operators.NONBETWEEN:
            return new Vector(x, y);
        default:
            throw new Error('unknown compare type');
    }
};
