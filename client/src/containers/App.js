import {connect} from 'react-redux';

import App from '../components/App';

const mapStateToProps = (state) => {
    return {
        rectangles: state.rectangles,
        circles: state.circles
    }
};

export default connect(mapStateToProps)(App);
