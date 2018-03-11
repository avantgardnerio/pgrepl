const initial = {
    documents: []
}

const reducer = (state = initial, action) => {
    switch(action.type) {
        case 'GOT_DOCUMENTS': return gotDocuments(state, action);
        default: return state;
    }
}

const gotDocuments = (state, action) => {
    return {...state, documents: action.documents};
}

export default reducer;