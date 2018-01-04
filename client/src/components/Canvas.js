import React, {Component} from 'react';
import uuidv4 from 'uuid/v4';

import {
    createDeleteRowAction,
    createInsertRowAction,
    createTxnAction,
    createUpdateRowAction
} from "../actions/database";
import {add, equals, subtract} from "../util/math";

export default class Canvas extends Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedId: undefined,
            curPos: undefined,
            downPos: undefined
        }
    }

    // --------------------------------------------- handlers ---------------------------------------------------------
    onKeyPress = (e) => {
        if (e.key === 'd' && this.state.selectedId) {
            const change = createDeleteRowAction("circles", this.selectedCircle);
            const action = createTxnAction([change]);
            console.log(`Deleting a circle at [${this.selectedCircle.cx}, ${this.selectedCircle.cy}] as TXN=${action.txn.id}`);
            this.props.commit(action);
            this.setState({selectedId: undefined});
        }
    };

    onMouseDown = (e) => {
        this.setState({selectedId: undefined});
    };

    onMouseMove = (e) => {
        super.setState({
            curPos: [e.clientX, e.clientY]
        })
    };

    onMouseUp = (e) => {
        if (this.state.selectedId === undefined) {
            const circle = {
                id: uuidv4(),
                cx: e.clientX - Math.round(e.target.getBoundingClientRect().x),
                cy: e.clientY - Math.round(e.target.getBoundingClientRect().y),
                r: 40,
                stroke: "green",
                strokeWidth: 4,
                fill: "yellow"
            };
            const change = createInsertRowAction("circles", circle);
            const action = createTxnAction([change]);
            console.log(`Inserting a circle at [${circle.cx}, ${circle.cy}] as TXN=${action.txn.id}`);
            this.props.commit(action);
        } else {
            if (!this.state.selectedId) return;
            if (equals(this.state.curPos, this.state.downPos)) {
                // select
                this.setState({downPos: undefined});
            } else {
                // drag
                const pos = this.selectedItemPos;
                const newCircle = {
                    ...this.selectedCircle,
                    cx: pos[0],
                    cy: pos[1]
                };
                const change = createUpdateRowAction("circles", newCircle, this.props.state);
                const action = createTxnAction([change]);
                console.log(`Moving a circle to [${newCircle.cx}, ${newCircle.cy}] as TXN=${action.txn.id}`);
                this.props.commit(action);
                this.setState({selectedId: undefined, downPos: undefined});
            }
        }
    };

    // ------------------------------------------- properties ---------------------------------------------------------
    get selectedCircle() {
        return this.props.circles.rows[this.state.selectedId];
    }

    get selectedItemPos() {
        const selPos = [this.selectedCircle.cx, this.selectedCircle.cy];
        const pos = this.state.downPos ? add(selPos, subtract(this.state.curPos, this.state.downPos)) : selPos;
        return pos;
    }

    get selectedItem() {
        if (!this.selectedCircle) return [];
        const pos = this.selectedItemPos;
        return <circle key="dragItem" className="dragItem" cx={pos[0]} cy={pos[1]}
                       r="40" fill="blue" fillOpacity="0.5"/>
    }

    get circles() {
        if (!this.props.circles) return [];
        return Object.values(this.props.circles.rows)
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
        this.setState({
            selectedId: e.target.id,
            curPos: [e.clientX, e.clientY],
            downPos: [e.clientX, e.clientY]
        });
        e.stopPropagation();
    };

    // -------------------------------------------- render ------------------------------------------------------------
    render() {
        return <svg width="100" height="100"
                    onMouseDown={this.onMouseDown}
                    onMouseMove={this.onMouseMove}
                    onMouseUp={this.onMouseUp}
                    onKeyPress={this.onKeyPress}
                    tabIndex="0"
        >
            {this.rectangles}
            {this.circles}
            {this.selectedItem}
        </svg>

    }
}