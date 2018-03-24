import Redux from '../../../node_modules/redux/lib/index.js';
import ReduxFirstRouting from '../../../node_modules/redux-first-routing/lib/index.js';

import reducer from '../reducers/reducer.mjs';

const { combineReducers, applyMiddleware, createStore } = Redux || window.Redux;
const { createBrowserHistory, routerReducer, routerMiddleware, startListener } = ReduxFirstRouting || window.ReduxFirstRouting;

export default class ReplClient {
    constructor() {
        const history = createBrowserHistory();

        const rootReducer = combineReducers({
            main: reducer,
            router: routerReducer
        });
        const middleware = applyMiddleware(
            ReduxThunk.default,
            routerMiddleware(history)
        );
        this._store = createStore(rootReducer, middleware);
        startListener(history, this.store);
    }

    get store() {
        return this._store;
    }
}