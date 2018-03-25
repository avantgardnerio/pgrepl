import Redux from '../../../node_modules/redux/lib/index.js';
import ReduxThunk from '../../../node_modules/redux-thunk/lib/index.js'
import replReducer from '../reducers/replReducer.mjs';
import SocketService from './SocketService.mjs';
import {connected, disconnected, snapshotRequest, subscribeRequest} from "../actions/websocketActions.mjs";

const {combineReducers, applyMiddleware, createStore} = Redux || window.Redux;
const thunk = (ReduxThunk || window.ReduxThunk).default;

export default class ReplClient {
    constructor(customReducers = {}, customMiddleware = [], wsUrl, WebSocket) {

        // Redux
        const rootReducer = combineReducers({
            db: replReducer,
            ...customReducers
        });
        const middleware = applyMiddleware(...[
            thunk,
            ...customMiddleware
        ]);
        this._store = createStore(rootReducer, middleware);

        // WebSocket
        this.ws = new SocketService(wsUrl, WebSocket);
        this.ws.onConnect = () => this.onConnect();
        this.ws.onMsg = (msg) => this.store.dispatch(msg);
        this.ws.onClose = () => this.store.dispatch(disconnected());
        //this.ws.connect();
    }

    onConnect() {
        this.store.dispatch(connected());
        const state = this.store.getState();
        Object.keys(state.db.documents).forEach(docId => {
            const doc = state.db.documents[docId];
            if(doc.lsn) {
                const msg = subscribeRequest(this.ws.id, docId, doc.lsn);
                this.ws.write(msg);
            } else {
                const msg = snapshotRequest(docId);
                this.ws.write(msg);
            }
        });
    }

    get store() {
        return this._store;
    }
}