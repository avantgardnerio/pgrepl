import {connect} from 'react-redux';

import App from '../components/App';

const mapStateToProps = (state) => {
    return {
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
)(App);
