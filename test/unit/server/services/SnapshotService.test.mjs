import Mocha from 'mocha';
import chai from 'chai';

import SnapshotService from '../../../../src/services/SnapshotService.mjs';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`SnapshotService`);

    suite.addTest(new Mocha.Test(`should get version`, async () => {
        const version = await SnapshotService.getVersion();
        chai.expect(version >= 9).to.equal(true);
    }));

    suite.addTest(new Mocha.Test(`should get LSN`, async () => {
        const lsn = await SnapshotService.getCurrentLSN();
        chai.expect(/[0-9A-F]+\/[0-9A-F]+/g.test(lsn)).to.equal(true);
    }));

    suite.addTest(new Mocha.Test(`should get schema`, async () => {
        const ss = await SnapshotService.takeSnapshot(true);
        chai.expect(ss.lsn.length > 0).to.equal(true);
        chai.expect(ss.tables.length > 0).to.equal(true);
        const migrations = ss.tables.find(it => it.name === `__migrations__`);
        chai.expect(migrations.columns.length).to.equal(1);
        chai.expect(migrations.rows.length > 0).to.equal(true);
    }));

    parent.addSuite(suite);
}

