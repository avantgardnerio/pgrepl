export const getDocuments = () => {
    return async (dispatch) => {
        const res = await fetch(`/documents`);
        const documents = await res.json();
        const action = gotDocuments(documents);
        dispatch(action);
    }
}

export const gotDocuments = (documents) => {
    return {
        type: 'GOT_DOCUMENTS',
        documents
    }
}