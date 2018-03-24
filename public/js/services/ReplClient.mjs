import Redux from 'redux';
import ReduxFirstRouting from 'redux-first-routing';

const { combineReducers, applyMiddleware, createStore } = Redux;
const { createBrowserHistory, routerReducer, routerMiddleware, startListener } = ReduxFirstRouting;

export default class ReplClient {
    constructor() {
        console.log(`-------------`, createStore)
    }
}