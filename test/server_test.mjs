import Mocha from 'mocha';
import chai from 'chai';
import path from 'path';
import request from 'supertest';
import migrations from 'sql-migrations';

import dbSvc, { db, pg } from '../src/services/DbService.mjs';
import cfgSvc from '../src/services/ConfigService.mjs';
import WebDriver from './WebDriver.mjs';
import app, { server } from '../src/app.mjs';

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
    const res = await migrations.migrate(configuration);
    console.log(`--------------`, res);
    // val flyway = Flyway()
    // flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
    // flyway.migrate()

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

suite.addTest(new Mocha.Test("GET /users", (done) => {
  request(app).get('/users')
    .expect(200, done)
}));

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

runner.run();
