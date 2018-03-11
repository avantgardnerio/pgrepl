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
  try {
    driver = new WebDriver();
    await driver.createSession();
  } catch (er) {
    console.error(`Error creating session`, er);
  }
});

suite.afterAll('after', async () => {
  try {
    await driver.close();
    server.close();
  } catch (er) {
    console.error(`Error closing session`, er);
  }
});

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
  }
}));

runner.run();
