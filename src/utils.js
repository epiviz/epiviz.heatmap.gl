export function isObject(object) {
    return typeof object === 'object' && Array.isArray(object) === false;
}

export const getMinMax = (arr) => {
    var max = -Number.MAX_VALUE,
        min = Number.MAX_VALUE;
    arr.forEach(function (x) {
        if (max < x) {
            max = x;
        }
        if (min > x) {
            min = x;
        }
    });
    return [min, max];
}