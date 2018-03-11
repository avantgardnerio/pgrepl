import Mocha from 'mocha';
import request from 'supertest';

import WebDriver from './WebDriver.mjs';
import app, { server } from '../src/app.mjs';

const suite = new Mocha.Suite("Programatic Suite");
const runner = new Mocha.Runner(suite);
const reporter = new Mocha.reporters.Spec(runner);

let driver;
suite.beforeAll('before', async () => {
  try {
    driver = new WebDriver();
    await driver.createSession();
  } catch (er) {
    console.error(er);
  }
});

suite.afterAll('after', async () => {
  try {
    await driver.close();
    server.close();
  } catch (er) {
    console.error(er);
  }
  console.log('done!');
});

suite.addTest(new Mocha.Test("GET /users", (done) => {
  try {
    request(app).get('/users')
      .expect(200, done)
  } catch (er) {
    console.error(er);
  }
}));

suite.addTest(new Mocha.Test("Driver can browse", async () => {
  try {
    await driver.visit('http://localhost:3000/index.html');
  } catch (er) {
    console.error(er);
  }
}));

runner.run();
