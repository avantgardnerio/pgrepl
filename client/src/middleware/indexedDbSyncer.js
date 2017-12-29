export const createIndexedDbSyncer = (db) => {
    const indexedDbSyncer = () => {
        const wrapDispatch = (next) => {
            const dispatch = (action) => {
                switch (action.type) {
                    case 'COMMIT':
                        try {
                            // TODO: Save to DB
                            console.log('Saving', action.txn.id);
                            return next(action);
                        } catch (ex) {
                            // TODO: retry on reconnect
                            console.error("Error committing to IndexedDb!", ex);
                        }
                        break;
                    default:
                        return next(action);
                }
            };
            return dispatch;
        };
        return wrapDispatch;
    };
    return indexedDbSyncer;
};
