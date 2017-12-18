import React, {Component} from 'react';
import uuidv4 from 'uuid/v4';

import {createTxn, insertRow, updateRow} from '../actions';

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dragId: undefined
        }
    }

    get circles() {
        if (!this.props.circles) return [];
        return this.props.circles.rows
            .map(c => <circle key={c.id} cx={c.cx} cy={c.cy} r={c.r} stroke={c.stroke} onMouseDown={this.onObjectDown}
                              strokeWidth={c.strokeWidth} fill={c.fill} id={c.id}/>)
    }

    get rectangles() {
        if (!this.props.rectangles) return [];
        return this.props.rectangles.rows
            .map(r => <rect key={r.id} width={r.width} height={r.height}
                            fill={r.fill} strokeWidth={r.strokeWidth}
                            stroke={r.stroke}/>)
    }

    onObjectDown = (e) => {
        this.setState({dragId: e.target.id});
    };

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
        const change = insertRow("circles", circle);
        const txn = createTxn([change]);
        this.props.commit(txn);
    };

    onMouseMove = (e) => {
        //console.log(e);
    };

    onMouseUp = (e) => {
        if(this.state.dragId === undefined) return;
        const circle = this.props.circles.rows.find(c => c.id === this.state.dragId);
        const newCircle = {
            ...circle,
            cx: e.clientX,
            cy: e.clientY
        };
        const change = updateRow("circles", circle);
        const txn = createTxn([change]);
        this.props.commit(txn);
        this.setState({dragId: undefined});
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
                    <table>
                        <tbody>
                        <tr>
                            <td>state</td>
                            <td>
                                <input type="text" readOnly={true} value={JSON.stringify(this.props.state)}></input>
                            </td>
                        </tr>
                        <tr>
                            <td>lsn</td>
                            <td class="lsn">{this.props.state.lsn}</td>
                        </tr>
                        <tr>
                            <td>xid</td>
                            <td>{this.props.state.xid}</td>
                        </tr>
                        <tr>
                            <td>circle count</td>
                            <td class="numCircles">{this.props.circles.rows.length}</td>
                        </tr>
                        <tr>
                            <td>log length</td>
                            <td>{this.props.state.log.length}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

