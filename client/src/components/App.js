import React, {Component} from 'react';

import Canvas from '../containers/Canvas';
import Panel from '../containers/Panel';

export default class App extends Component {

    render() {
        return (
            <div className="App">
                <Canvas/>
                <Panel/>
            </div>
        );
    }
}

