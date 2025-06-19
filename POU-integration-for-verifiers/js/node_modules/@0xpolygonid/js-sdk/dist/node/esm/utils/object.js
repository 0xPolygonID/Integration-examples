/**
 * Merges two objects together, prioritizing the properties of the second object.
 * If a property exists in both objects, the value from the second object will be used.
 * @param credSubject - The first object to merge.
 * @param otherCredSubject - The second object to merge.
 * @returns A new object with the merged properties.
 */
export function mergeObjects(credSubject, otherCredSubject) {
    let result = {};
    const credSubjectKeys = Object.keys(credSubject);
    for (const key of credSubjectKeys) {
        if (typeof otherCredSubject[key] !== 'undefined') {
            if (typeof credSubject[key] !== 'object' && typeof otherCredSubject[key] !== 'object') {
                throw new Error('Invalid query');
            }
            const subjectProperty = credSubject[key];
            const otherSubjectProperty = otherCredSubject[key];
            const propertyOperators = Object.keys(subjectProperty);
            const subjectPropertyResult = {};
            for (const operatorKey of propertyOperators) {
                if (typeof otherSubjectProperty[operatorKey] !== 'undefined') {
                    const operatorValue1 = subjectProperty[operatorKey];
                    const operatorValue2 = otherSubjectProperty[operatorKey];
                    subjectPropertyResult[operatorKey] = [
                        ...new Set([
                            ...(subjectPropertyResult[operatorKey] ?? []),
                            operatorValue1,
                            ...(Array.isArray(operatorValue2) ? operatorValue2 : [operatorValue2])
                        ])
                    ];
                }
                else {
                    subjectPropertyResult[operatorKey] = subjectProperty[operatorKey];
                }
            }
            result[key] = {
                ...otherCredSubject[key],
                ...subjectPropertyResult
            };
        }
    }
    // Add remaining keys from obj2
    result = { ...credSubject, ...otherCredSubject, ...result };
    return result;
}
