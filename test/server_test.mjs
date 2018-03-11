import Mocha from 'mocha';
import chai from 'chai';
import request from 'supertest';

import WebDriver from './WebDriver.mjs';
import app, { server } from '../src/app.mjs';

const suite = new Mocha.Suite("Programatic Suite");
const runner = new Mocha.Runner(suite);
const reporter = new Mocha.reporters.Spec(runner);

let driver;
suite.beforeAll('before', async () => {
  driver = new WebDriver();
  await driver.createSession();
});

suite.afterAll('after', async () => {
  await driver.close();
  server.close();
});

suite.addTest(new Mocha.Test("GET /users", (done) => {
  request(app).get('/users')
    .expect(200, done)
}));

suite.addTest(new Mocha.Test("Driver can browse", async () => {
  await driver.visit('http://localhost:3000/index.html');
  const el = await driver.find('div')
  const text = await el.getText();
  chai.expect(text).to.equal('Hello world!');
}));

runner.run();
