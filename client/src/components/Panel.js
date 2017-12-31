import React, {Component} from 'react';

export default class Panel extends Component {

    get connectionText() {
        return this.props.connected ? 'Disconnect' : 'Connect';
    }

    toggleConnection = () => {
        const func = this.props.connected ? this.props.disconnect : this.props.connect;
        func();
    };

    render() {
        return <div>
            <table>
                <tbody>
                <tr>
                    <td>WebSocket</td>
                    <td>
                        <input type="button" className="btnConnect" value={this.connectionText}
                               onClick={this.toggleConnection}/>
                    </td>
                </tr>
                <tr>
                    <td>IndexedDB</td>
                    <td>
                        <input type="button" className="btnClear" value="Clear" onClick={this.props.clearDb}
                               disabled={this.props.cleared}/>
                    </td>
                </tr>
                <tr>
                    <td>state</td>
                    <td>
                        <textarea readOnly="true" className="tbState"
                                  value={JSON.stringify(this.props.state, undefined, 2)}/>
                    </td>
                </tr>
                <tr>
                    <td>lsn</td>
                    <td className="lsn">{new Number(this.props.state.lsn).toLocaleString()}</td>
                </tr>
                <tr>
                    <td>xid</td>
                    <td>{this.props.state.xid}</td>
                </tr>
                <tr>
                    <td>circle count</td>
                    <td className="numCircles">{this.props.circles.rows.length}</td>
                </tr>
                <tr>
                    <td>log length</td>
                    <td className="logLength">{this.props.state.log.length}</td>
                </tr>
                </tbody>
            </table>
        </div>

    }
}