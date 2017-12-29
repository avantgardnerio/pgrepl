import React from 'react';
import ReactDOM from 'react-dom';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';

import './index.css';
import App from './containers/App';
import { logSender } from './middleware/logSender';
import reducer from './reducers';
import SocketService from './SocketService';

const elementIds = ['leftRoot','rightRoot'];
elementIds.forEach((elementId) => {
    const ws = new SocketService();
    ws.onConnect = () => ws.write({type: 'HELLO', payload: ws.id});
    const ls = logSender(ws);
    const store = createStore(reducer, applyMiddleware(ls));
    ws.onMsg = (msg) => store.dispatch(msg);
    ws.connect();

    ReactDOM.render(
        <Provider store={store}>
            <App name={elementId} />
        </Provider>
        , document.getElementById(elementId)
    );
});
