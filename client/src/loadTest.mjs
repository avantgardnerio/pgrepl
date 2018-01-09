import WebSocket from 'universal-websocket-client';

import SocketService from './SocketService';
import {snapshotRequest} from "./actions/websocketActions";
import {subscribeRequest} from "./actions/websocketActions.mjs";

const url = 'ws://127.0.0.1:8080/echo';
const connectRate = 1000;
const sessionLength = 60000;
const startInstant = new Date().getTime();

let clientCount = 0;
const startSession = async () => {
    const ws = new SocketService(url, WebSocket);
    ws.onConnect = () => { // TODO: dedupe index.js
        clientCount++;
        console.log(`CONNECT: ${clientCount} clients connected @${new Date().getTime() - startInstant}`);
        const msg = snapshotRequest();
        ws.write(msg);
        setTimeout(() => {
            console.log(`${ws.id} got bored, disconnecting...`);
            ws.close();
        }, sessionLength);
    };
    ws.onMsg = (msg) => {
        switch (msg.type) {
            case `SNAPSHOT_RESPONSE`:
                console.log(`lsn=${msg.payload.lsn}`);
                if (ws.connected) ws.write(subscribeRequest(ws.id, msg.lsn));
                break;
            default:
                console.log(`Unknown message type: ${msg.type}`);
        }
    };
    ws.onClose = () => {
        clientCount--;
        console.log(`DISCONNECT: ${clientCount} clients connected @${new Date().getTime() - startInstant}`);
    };
    ws.connect();
};

const connectInterval = setInterval(startSession, connectRate);