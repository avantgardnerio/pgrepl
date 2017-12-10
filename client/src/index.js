import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';

import './index.css';
import App from './containers/App';
import { logSender } from './middleware/logSender';
import reducer from './reducers';
import WsTool from './websocket';

// TODO: DRY-out initialization
const leftSocket = new WsTool();
const rightSocket = new WsTool();
leftSocket.connect();
rightSocket.connect();
const leftMiddleware = logSender(leftSocket);
const rightMiddleware = logSender(leftSocket);

const leftStore = createStore(reducer, applyMiddleware(leftMiddleware));
const rightStore = createStore(reducer, applyMiddleware(rightMiddleware));

// TODO: find a way to avoid circular reference
leftSocket.store = leftStore;
rightSocket.store = rightStore;

ReactDOM.render(
    <Provider store={leftStore}>
        <App />
    </Provider>
    , document.getElementById('leftRoot')
);
ReactDOM.render(
    <Provider store={rightStore}>
        <App />
    </Provider>,
    document.getElementById('rightRoot')
);
