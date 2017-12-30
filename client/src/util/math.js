import {range} from "lodash";

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const equals = (a, b) => {
    if(!a && !b) return true;
    if(!a || !b) return false;
    if(a.length !== b.length) return false;
    return range(a.length).reduce((acc, cur) => acc && a[cur] === b[cur], true);
};
export const unique = (ar) => [...new Set(ar)];