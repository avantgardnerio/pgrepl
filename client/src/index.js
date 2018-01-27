import React from 'react';
import ReactDOM from 'react-dom';
import {applyMiddleware, createStore} from 'redux';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';

import registerServiceWorker from './registerServiceWorker';
import './index.css';
import App from './containers/App';
import {createWebSocketSender} from './middleware/webSocketSender';
import createReducer from './reducers/replicationReducer';
import SocketService from './SocketService';
import Database from "./Database";
import {createIndexedDbSyncer} from "./middleware/indexedDbSyncer";
import {connected, disconnected, snapshotRequest, subscribeRequest} from "./actions/websocketActions";

const elementIds = ['leftRoot', 'rightRoot'];
elementIds.forEach((elementId) => {

    const init = async () => {
        try {
            const db = new Database(elementId);
            await db.connect();
            const initialState = await db.getInitialState();
            const reducer = createReducer(initialState, db);

            const url = document.location.toString()
                .replace('http://', 'ws://')
                .replace(":3000", ":8080") + "echo";
            const ws = new SocketService(url, WebSocket);
            const socketSender = createWebSocketSender(ws);
            const dbSyncer = createIndexedDbSyncer(db);
            const store = createStore(reducer, applyMiddleware(socketSender, dbSyncer, thunk));
            ws.onMsg = (msg) => store.dispatch(msg);
            ws.onConnect = () => {
                console.log('Connected!');
                const lsn = store.getState().lsn; // TODO: should be in another file?
                if (lsn > 0) {
                    console.log(`Found initial state in IndexedDb`);
                    console.log(`Subscribing to all changes from server where LSN > ${lsn}`);
                    const msg = subscribeRequest(ws.id, lsn);
                    ws.write(msg);
                } else {
                    console.log(`IndexedDb is empty, requesting snapshot from server`);
                    const msg = snapshotRequest();
                    ws.write(msg);
                }
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
        } catch (ex) {
            console.error(`Error starting app!`, ex);
        }
    };
    init();
});
registerServiceWorker();