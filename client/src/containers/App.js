import {connect} from 'react-redux';

import App from '../components/App';

const mapStateToProps = (state) => {
    return {
        rectangles: state.tables.rectangles,
        circles: state.tables.circles
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
)(App);
