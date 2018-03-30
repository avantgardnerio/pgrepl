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
        await db.none(`delete from line`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [uuid(), `test doc`, uuid()]
        );

        await driver.visit(`http://localhost:3000/`);
        const el = await driver.find(`#app li`);
        chai.expect(el.length).to.equal(1);
        chai.expect(await el[0].getText()).to.equal(`test doc`);
    }));

    suite.addTest(new Mocha.Test(`should create documents`, async () => {
        await db.none(`delete from line`);
        await db.none(`delete from document`);

        await driver.visit(`http://localhost:3000/documents/new`);
        const tbName = (await driver.find(`#app input`))[0];
        const btnSave = (await driver.find(`#app button`))[0];
        tbName.sendKeys(`inserted doc`);
        btnSave.click();
        await driver.waitForElements(`#app .documentNew`);
        const item = (await driver.find(`#app li`))[0];
        const text = await item.getText();
        chai.expect(text).to.equal(`inserted doc`);
    }));

    suite.addTest(new Mocha.Test(`should edit documents`, async () => {
        await db.none(`delete from line`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [uuid(), `test doc`, uuid()]
        );

        await driver.visit(`http://localhost:3000/`);
        const li = (await driver.waitForElements(`#app li`))[0];
        li.click();
        const svg = (await driver.find(`#app svg`));
        chai.expect(svg.length).to.equal(1);
    }));

    suite.addTest(new Mocha.Test(`should draw`, async () => {
        const docId = uuid();
        await db.none(`delete from line`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [docId, `test doc`, uuid()]
        );

        await driver.visit(`http://localhost:3000/documents/${docId}`);
        const svg = (await driver.find(`#app svg`));

        const e1 = { offsetX: 10, offsetY: 10 };
        const e2 = { offsetX: 100, offsetY: 100 };
        const e3 = { offsetX: 100, offsetY: 100 };
        const drag = function() {
            const [e1, e2, e3] = arguments;
            const el = document.querySelector('#app svg');
            el.onclick(e1);
            el.onmousemove(e2);
            el.onclick(e3);
            const res = el.children.length;
            return res;
        };
        const res = await driver.execute(drag, [e1, e2, e3]);
        const children = (await driver.find(`#app > svg > *`));
        chai.expect(children.length).to.equal(0);
        // TODO: more transparent-box instrumentation to ensure action is fired, etc
    }));

    parent.addSuite(suite);
}

