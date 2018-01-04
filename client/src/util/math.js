export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const equals = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
};
export const unique = (ar) => [...new Set(ar)];