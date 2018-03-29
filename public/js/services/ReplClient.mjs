import Redux from '../../../node_modules/redux/lib/index.js';
import ReduxThunk from '../../../node_modules/redux-thunk/lib/index.js'
import replReducer from '../reducers/replReducer.mjs';
import SocketService from './SocketService.mjs';
import {connected, disconnected, snapshotRequest, subscribeRequest} from "../actions/websocketActions.mjs";
import {createWebSocketSender} from "../middleware/websocketSender.mjs";

const {combineReducers, applyMiddleware, createStore} = Redux || window.Redux;
const thunk = (ReduxThunk || window.ReduxThunk).default;

export default class ReplClient {
    constructor(customReducers = {}, customMiddleware = [], wsUrl, WebSocket) {
        // WebSocket
        this.ws = new SocketService(wsUrl, WebSocket);
        this.ws.onConnect = () => this.onConnect();
        this.ws.onMsg = (msg) => this.store.dispatch(msg);
        this.ws.onClose = () => this.store.dispatch(disconnected());
        this.ws.connect();

        // Redux
        const socketMw = createWebSocketSender(this.ws);
        const rootReducer = combineReducers({
            db: replReducer,
            ...customReducers
        });
        const middleware = applyMiddleware(...[
            thunk,
            socketMw,
            ...customMiddleware
        ]);
        this._store = createStore(rootReducer, middleware);
    }

    onConnect() {
        this.store.dispatch(connected());
    }

    get store() {
        return this._store;
    }
}