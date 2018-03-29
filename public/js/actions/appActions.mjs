const { push } = ReduxFirstRouting;

export const getDocuments = () => {
    return async (dispatch) => {
        try {
            const res = await fetch(`/api/documents`);
            const documents = await res.json();
            const action = gotDocuments(documents);
            dispatch(action);
        } catch (er) {
            console.error(`appActions.mjs`, er);
        }
    }
};

export const gotDocuments = (documents) => {
    return {
        type: 'GOT_DOCUMENTS',
        documents
    }
};

export const saveDocument = (doc) => {
    return async (dispatch) => {
        try {
            await fetch(`/api/documents`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: `POST`,
                body: JSON.stringify(doc)
            });
            dispatch(getDocuments());
            dispatch(push(`/`));
        } catch(er) {
            console.error(`appActions`, er);
        }
    }
};