import Mocha from 'mocha';
import chai from 'chai';
import uuid from "uuid/v4";

import SnapshotService from '../../../../src/services/SnapshotService.mjs';

const lineId = uuid();
const documentId = uuid();
const curTxnId = uuid();
export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`SnapshotService`);

    suite.beforeAll(`before`, async () => {
        try {
            await db.none(`delete from line`);
            await db.none(`delete from document`);
            await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
                [documentId, `test doc`, curTxnId]
            );
            await db.none(`INSERT INTO line("id", "documentId", "x1", "y1", "x2", "y2", "curTxnId")
            VALUES($1, $2, $3, $4, $5, $6, $7);`,
                [lineId, documentId, 1, 2, 3, 4, curTxnId]
            );
        } catch (er) {
            console.error(`SnapshotService.test.js before`, er);
        }
    });

    suite.addTest(new Mocha.Test(`should get version`, async () => {
        const version = await SnapshotService.getVersion();
        chai.expect(version >= 9).to.equal(true);
    }));

    suite.addTest(new Mocha.Test(`should get LSN`, async () => {
        const lsn = await SnapshotService.getCurrentLSN();
        chai.expect(/[0-9A-F]+\/[0-9A-F]+/g.test(lsn)).to.equal(true);
    }));

    suite.addTest(new Mocha.Test(`should get schema`, async () => {
        const ss = await SnapshotService.takeSnapshot(`document`, [documentId]);
        chai.expect(ss.lsn.length > 0).to.equal(true);
        chai.expect(ss.tables.length > 0).to.equal(true);
        const lines = ss.tables.find(it => it.name === `line`);
        chai.expect(lines.columns.length).to.equal(11);
        chai.expect(lines.rows.length > 0).to.equal(true);
    }));

    parent.addSuite(suite);
}

