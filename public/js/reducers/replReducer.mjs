const initial = {
    documents: {}
};

const reducer = (state = initial, action) => {
    console.log(`action=`, action);
    switch (action.type) {
        case `OPEN_DOC`:
            return openDoc(state, action);
        default:
            return state;
    }
};

const openDoc = (state, action) => {
    const docId = action.docId;
    const doc = state.documents[docId] || {lsn: 0};
    const newState = {
        ...state,
        documents: {
            ...state.documents,
            [docId]: doc
        }
    };
    return newState;
};

export default reducer;