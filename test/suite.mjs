import Mocha from 'mocha';
import chai from 'chai';
import path from 'path';
import migrations from 'sql-migrations';

import dbSvc, { db, pg } from '../src/services/DbService.mjs';
import cfgSvc from '../src/services/ConfigService.mjs';
import WebDriver from './WebDriver.mjs';
import app, { server } from '../src/app.mjs';
import documentPage from './uat/documentPage.mjs';
import documentApi from './api/documentApi.mjs';

process.env.DB_NAME = `pgrepl_test`;

const configuration = {
  migrationsDir: './migrations',
  host: 'localhost',
  port: 5432, 
  db: cfgSvc.dbName, 
  user: 'postgres', 
  password: 'postgres'
};

const suite = new Mocha.Suite("Programatic Suite");
const runner = new Mocha.Runner(suite);
const reporter = new Mocha.reporters.Spec(runner);
const driver = new WebDriver();

suite.beforeAll('before', async () => {
  try {
    await migrations.migrate(configuration);
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
    server.close();
  } catch (er) {
    console.error(`Error closing session`, er);
    throw er;
  }
});

// -------------------------------- UAT ---------------------------------
documentPage(suite, driver);

// -------------------------------- API ---------------------------------
documentApi(suite, driver);

// suite.addTest(new Mocha.Test("query", async () => {
//   try {
//     const users = await db.any('SELECT * FROM contract limit 1');
//     console.log(users);
//   }
//   catch (er) {
//     console.error(er);
//     throw er;
//   }
// }));

runner.run();
