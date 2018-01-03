import {createDatabaseClearedAction} from "../actions/database";

export const createIndexedDbSyncer = (db) => {
    const indexedDbSyncer = (store) => {
        const wrapDispatch = (next) => {
            const dispatch = (action) => {
                try {
                    switch (action.type) {
                        case 'CLEAR_DB':
                            clearDb(store, db);
                            break;
                        default:
                            return next(action);
                    }
                } catch (ex) {
                    // TODO: retry on reconnect
                    console.error("Error committing to IndexedDb!", ex);
                }
            };
            return dispatch;
        };
        return wrapDispatch;
    };
    return indexedDbSyncer;
};

const clearDb = async (store, db) => {
    await db.clear();
    store.dispatch(createDatabaseClearedAction());
};
