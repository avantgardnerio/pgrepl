import Mocha from 'mocha';
import chai from 'chai';
import uuid from 'uuid/v4';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`Document page`);

    suite.beforeAll(`before`, async () => {
    });

    suite.afterAll(`after`, async () => {
    });

    suite.addTest(new Mocha.Test(`should list documents`, async () => {
        await db.none(`delete from chapter`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [uuid(), `test doc`, uuid()]
        )

        await driver.visit(`http://localhost:3000/`);
        const el = await driver.find(`#left li`);
        chai.expect(el.length).to.equal(1);
        chai.expect(await el[0].getText()).to.equal(`test doc`);
    }));

    suite.addTest(new Mocha.Test(`should create documents`, async () => {
        await db.none(`delete from chapter`);
        await db.none(`delete from document`);

        await driver.visit(`http://localhost:3000/documents/new`);
        const tbName = (await driver.find(`#left input`))[0];
        const btnSave = (await driver.find(`#left button`))[0];
        tbName.sendKeys(`inserted doc`);
        btnSave.click();
        await driver.waitForElements(`.documentNew`);
        const item = (await driver.find(`li`))[0];
        const text = await item.getText();
        chai.expect(text).to.equal(`inserted doc`);
    }));

    parent.addSuite(suite);
}

