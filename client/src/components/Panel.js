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
                        <input type="button" value={this.connectionText} onClick={this.toggleConnection}/>
                    </td>
                </tr>
                <tr>
                    <td>IndexedDB</td>
                    <td>
                        <input type="button" value="Clear" onClick={this.props.clearDb}/>
                    </td>
                </tr>
                <tr>
                    <td>state</td>
                    <td>
                        <input type="text" readOnly={true} value={JSON.stringify(this.props.state)}/>
                    </td>
                </tr>
                <tr>
                    <td>lsn</td>
                    <td className="lsn">{this.props.state.lsn}</td>
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
                    <td>{this.props.state.log.length}</td>
                </tr>
                </tbody>
            </table>
        </div>

    }
}