import {connect} from 'react-redux';
import {connect as connectWs, disconnect} from '../actions/websocket';

import Panel from '../components/Panel';
import {clearDb} from "../actions/database";

const mapStateToProps = (state) => {
    return {
        connected: state.connected,
        rectangles: state.tables.rectangles,
        circles: state.tables.circles,
        cleared: state.cleared,
        state: state
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        clearDb: () => dispatch(clearDb()),
        connect: () => dispatch(connectWs()),
        disconnect: () => dispatch(disconnect())
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Panel);
