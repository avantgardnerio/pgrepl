import Mocha from 'mocha';
import chai from 'chai';

import dbSvc, { db, pg } from '../../src/services/DbService.mjs';

export default (parent, driver) => {
    const suite = new Mocha.Suite("Document list");

    suite.addTest(new Mocha.Test("Driver can browse", async () => {
        try {
            await driver.visit('http://localhost:3000/index.html');
            const el = await driver.find('#left li')
            chai.expect(el.length).to.equal(2);
            chai.expect(await el[0].getText()).to.equal('Alan Turing');
            chai.expect(await el[1].getText()).to.equal('Grace Hopper');
        } catch (er) {
            console.error(`Error navigating`, er);
            throw er;
        }
    }));

    parent.addSuite(suite);
}

