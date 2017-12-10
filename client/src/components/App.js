import React, {Component} from 'react';
import uuidv4 from 'uuid/v4';

import {insertRow, createTxn} from '../actions';

export default class App extends Component {

    componentDidMount() {

    }

    get circles() {
        if (!this.props.circles) return [];
        return this.props.circles.rows
            .map(c => <circle key={c.id} cx={c.cx} cy={c.cy} r={c.r} stroke={c.stroke}
                              strokeWidth={c.strokeWidth} fill={c.fill}/>)
    }

    get rectangles() {
        if (!this.props.rectangles) return [];
        return this.props.rectangles.rows
            .map(r => <rect key={r.id} width={r.width} height={r.height}
                            fill={r.fill} strokeWidth={r.strokeWidth}
                            stroke={r.stroke}/>)
    }

    onMouseDown = (e) => {
        const circle = {
            id: uuidv4(),
            cx: e.clientX,
            cy: e.clientY,
            r: 40,
            stroke: "green",
            strokeWidth: 4,
            fill: "yellow"
        };
        const circleInsert = insertRow("circles", circle);
        const txn = createTxn([circleInsert]);
        this.props.commit(txn);
    };

    onMouseMove = (e) => {
        //console.log(e);
    };

    onMouseUp = (e) => {
        //console.log(e);
    };

    render() {
        return (
            <div className="App">
                <svg width="100" height="100"
                     onMouseDown={this.onMouseDown}
                     onMouseMove={this.onMouseMove}
                     onMouseUp={this.onMouseUp}
                >
                    {this.rectangles}
                    {this.circles}
                </svg>
                <div>
                    Hello world!
                </div>
            </div>
        );
    }
}

