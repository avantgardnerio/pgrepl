import Mocha from 'mocha';
import chai from 'chai';
import path from 'path';
import migrations from 'sql-migrations';

import dbSvc, { db, pg } from '../src/services/DbService.mjs';
import cfgSvc from '../src/services/ConfigService.mjs';
import WebDriver from './WebDriver.mjs';
import app, { started } from '../src/app.mjs';
import documentPage from './uat/documentPage.mjs';
import documentApi from './api/documentApi.mjs';

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

started.then(() => runner.run());
