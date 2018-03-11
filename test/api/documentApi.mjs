import Mocha from 'mocha';
import chai from 'chai';
import request from 'supertest';

import app from '../../src/app.mjs';

import dbSvc, { db, pg } from '../../src/services/DbService.mjs';

export default (parent, driver) => {
    const suite = new Mocha.Suite("document API");

    suite.addTest(new Mocha.Test("GET /users", (done) => {
        request(app).get('/users')
            .expect(200, done)
    }));

    parent.addSuite(suite);
}

