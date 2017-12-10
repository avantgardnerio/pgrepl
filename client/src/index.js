import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';

import './index.css';
import App from './containers/App';
import reducer from './reducers';

const leftStore = createStore(reducer);
const rightStore = createStore(reducer);

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
