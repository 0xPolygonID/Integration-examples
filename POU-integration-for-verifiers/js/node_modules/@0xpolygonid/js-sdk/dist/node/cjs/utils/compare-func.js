"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bigIntCompare = void 0;
const bigIntCompare = (a, b) => {
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0;
};
exports.bigIntCompare = bigIntCompare;
