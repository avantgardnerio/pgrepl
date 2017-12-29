import {connect} from 'react-redux';

import Canvas from '../components/Canvas';

const mapStateToProps = (state) => {
    return {
        rectangles: state.tables.rectangles,
        circles: state.tables.circles,
        state: state
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        commit: (txn) => dispatch(txn)
    }
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Canvas);
