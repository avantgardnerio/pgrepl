import WebDriver from './WebDriver.mjs';

import Mocha from 'mocha';
import request from 'supertest';

import app from '../app';

const suite = new Mocha.Suite("Programatic Suite");
const runner = new Mocha.Runner(suite);
const reporter = new Mocha.reporters.Spec(runner);

let driver;
suite.beforeAll('before', async () => {
  driver = new WebDriver();
});

suite.afterAll('after', async () => {
  await driver.close();
});

suite.addTest(new Mocha.Test("GET /users", (done) => {
  request(app).get('/users')
    .expect(200, done)
}));

suite.addTest(new Mocha.Test("Driver can start", async () => {
  const obj = await driver.getStatus();
  console.log(obj);
}));

suite.addTest(new Mocha.Test("Driver can create session", async () => {
    const obj = await driver.createSession();
    console.log(obj);
}));

suite.addTest(new Mocha.Test("Driver can browse", async () => {
  await driver.visit('http://localhost:3000/index.html');
}));

runner.run();
