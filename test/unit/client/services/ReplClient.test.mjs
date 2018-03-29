import Mocha from 'mocha';
import chai from 'chai';

import ReplClient from '../../../../public/js/services/ReplClient.mjs';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`ReplService`);

    suite.addTest(new Mocha.Test(`should instantiate`, async () => {
        const WebSocket = function() {};
        const repl = new ReplClient({}, [], ``, WebSocket);
        chai.expect(repl).to.not.be.undefined;
    }));
    
    parent.addSuite(suite);
}

