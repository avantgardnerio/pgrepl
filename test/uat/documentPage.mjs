import Mocha from 'mocha';
import chai from 'chai';
import uuid from 'uuid/v4';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`Document page`);

    suite.beforeAll(`before`, async () => {
        await db.none(`delete from chapter`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [uuid(), `test doc`, uuid()]
        )
    });

    suite.afterAll(`after`, async () => {
    });

    suite.addTest(new Mocha.Test(`should list documents`, async () => {
        await driver.visit(`http://localhost:3000/`);
        const el = await driver.find(`#left li`)
        chai.expect(el.length).to.equal(2);
        chai.expect(await el[0].getText()).to.equal(`Alan Turing`);
        chai.expect(await el[1].getText()).to.equal(`Grace Hopper`);
    }));

    parent.addSuite(suite);
}

