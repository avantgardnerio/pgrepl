import WebDriver from './WebDriver.mjs';

import Mocha from 'mocha';
import * as fetch from 'isomorphic-fetch';
import request from 'supertest';

import app from '../app';

var suite = new Mocha.Suite("Programatic Suite");
var runner = new Mocha.Runner(suite);
var reporter = new Mocha.reporters.Spec(runner);

let driver;
suite.beforeAll('before', async () => {
  driver = new WebDriver();
})

suite.afterAll('after', async () => {
  await driver.close();
})

suite.addTest(new Mocha.Test("GET /users", (done) => {
  request(app).get('/users')
    .expect(200, done)
}));

suite.addTest(new Mocha.Test("Driver can start", async () => {
  const obj = driver.getStatus();
  console.log(obj);
}));

runner.run();
