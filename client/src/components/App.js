import React, {Component} from 'react';

export default class App extends Component {

    componentDidMount() {
        
    }

    get circles() {
        return this.props.circles
            .map(c => <circle key={c.id} cx={c.cx} cy={c.cy} r={c.r} stroke={c.stroke}
                              strokeWidth={c.strokeWidth} fill={c.fill} />)
    }

    get rectangles() {
        return this.props.rectangles
            .map(r => <rect key={r.id} width={r.width} height={r.height}
                           fill={r.fill} strokeWidth={r.strokeWidth}
                           stroke={r.stroke} />)
    }

    render() {
        return (
            <div className="App">
                <svg width="100" height="100">
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

