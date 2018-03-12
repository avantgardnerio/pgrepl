import Mocha from 'mocha';
import chai from 'chai';

import SnapshotService from '../../../../src/services/SnapshotService.mjs';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`SnapshotService`);

    suite.addTest(new Mocha.Test(`should get version`, async () => {
        const version = await SnapshotService.getVersion();
        chai.expect(version).to.equal(10);
    }));

    suite.addTest(new Mocha.Test(`should get LSN`, async () => {
        const lsn = await SnapshotService.getCurrentLSN();
        chai.expect(/[0-9A-F]+\/[0-9A-F]+/g.test(lsn)).to.equal(true);
    }));

    parent.addSuite(suite);
}

