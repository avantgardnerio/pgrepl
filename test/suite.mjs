import Mocha from 'mocha';

import {db, pg} from '../src/services/DbService.mjs';
import WebDriver from './WebDriver.mjs';
import app, {started} from '../src/app.mjs';
import documentPage from './uat/documentPage.test.mjs';
import documentApi from './api/documentApi.mjs';
import documentUnit from './unit/client/components/DocumentList.test.mjs';
import ssUnit from './unit/server/services/SnapshotService.test.mjs';
import replUnit from './unit/client/services/ReplClient.test.mjs';

const suite = new Mocha.Suite("Programatic Suite");
const runner = new Mocha.Runner(suite);
const reporter = new Mocha.reporters.Spec(runner);
const driver = new WebDriver();

suite.beforeAll('before', async () => {
    try {
        await driver.createSession();
    } catch (er) {
        console.error(`Error creating session`, er);
        throw er;
    }
});

suite.afterAll('after', async () => {
    try {
        pg.end();
        await driver.close();
        app.server.close();
    } catch (er) {
        console.error(`Error closing session`, er);
        throw er;
    }
});

// -------------------------------- UAT ---------------------------------
documentPage(suite, driver, db);

// -------------------------------- API ---------------------------------
documentApi(suite, driver, db);

// -------------------------------- Unit --------------------------------
documentUnit(suite);
ssUnit(suite);
replUnit(suite);

started.then(() => runner.run());
