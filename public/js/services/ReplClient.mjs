import Redux from '../../../node_modules/redux/lib/index.js';
import ReduxThunk from '../../../node_modules/redux-thunk/lib/index.js'

import reducer from '../reducers/reducer.mjs';

const {combineReducers, applyMiddleware, createStore} = Redux || window.Redux;
const thunk = (ReduxThunk || window.ReduxThunk).default;

export default class ReplClient {
    constructor(customReducers = {}, customMiddleware = []) {
        const rootReducer = combineReducers({
            main: reducer,
            ...customReducers
        });
        const middleware = applyMiddleware(...[
            thunk,
            ...customMiddleware
        ]);
        this._store = createStore(rootReducer, middleware);
    }

    get store() {
        return this._store;
    }
}