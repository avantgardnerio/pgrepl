import createReducer from './index';
import {action, expected, state} from '../test/fixtures/conflict';

describe(`the reducer`, () => {
    it(`should handle conflicts`, () => {
        const initialState = {
            lsn: 0
        };
        const reducer = createReducer(initialState);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });
});