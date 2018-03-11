import Mocha from 'mocha';
import chai from 'chai';
import request from 'supertest';

import app from '../../src/app.mjs';

export default (parent, driver, db) => {
    const suite = new Mocha.Suite("document API");

    suite.addTest(new Mocha.Test("GET /users", (done) => {
        request(app).get('/users')
            .expect(200, done)
    }));

    parent.addSuite(suite);
}

