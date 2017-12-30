import React from 'react';
import ReactDOM from 'react-dom';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';

import './index.css';
import App from './containers/App';
import {createWebSocketSender} from './middleware/webSocketSender';
import createReducer from './reducers';
import SocketService from './SocketService';
import Database from "./Database";
import {createIndexedDbSyncer} from "./middleware/indexedDbSyncer";
import {connected, disconnected, snapshotRequest, subscribeRequest} from "./actions/websocket";

const elementIds = ['leftRoot', 'rightRoot'];
elementIds.forEach((elementId) => {

    const init = async () => {
        const db = new Database(elementId);
        await db.connect();
        const initialState = await db.getInitialState();
        const reducer = createReducer(initialState, db);

        const ws = new SocketService();
        const socketSender = createWebSocketSender(ws);
        const dbSyncer = createIndexedDbSyncer(db);
        const store = createStore(reducer, applyMiddleware(socketSender, dbSyncer, thunk));
        ws.onMsg = (msg) => store.dispatch(msg);
        ws.onConnect = () => {
            console.log('Connected!');
            const lsn = store.getState().lsn; // TODO: should be in another file?
            console.log(lsn ? 'Found initial state, subcribing to changes' : 'Requesting snapshot');
            const msg = lsn ? subscribeRequest(ws.id, lsn) : snapshotRequest();
            ws.write(msg);
            store.dispatch(connected());
        };
        ws.onClose = () => {
            store.dispatch(disconnected());
        };
        //ws.connect();

        ReactDOM.render(
            <Provider store={store}>
                <App name={elementId}/>
            </Provider>
            , document.getElementById(elementId)
        );
    };
    init();
});
