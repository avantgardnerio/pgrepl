import Mocha from 'mocha';
import chai from 'chai';
import request from 'supertest';
import uuid from 'uuid/v4';

import app from '../../src/app.mjs';

const documentId = uuid();
const curTxnId = uuid();
export default (parent, driver, db) => {
    const suite = new Mocha.Suite(`Document API`);

    suite.beforeAll(`before`, async () => {
        await db.none(`delete from chapter`);
        await db.none(`delete from document`);
        await db.none(`INSERT INTO document("id", "name", "curTxnId") VALUES($1, $2, $3)`,
            [documentId, `test doc`, curTxnId]
        )
    });

    suite.addTest(new Mocha.Test(`should return a list of documents`, (done) => {
        request(app).get(`/api/documents`)
            .end((err, res) => {
                chai.expect(err).to.equal(null);
                chai.expect(res.body).to.deep.equal([{
                    id: documentId,
                    name: `test doc`,
                    curTxnId: curTxnId,
                    prvTxnId: null
                }]);
                done();
            })
    }));

    parent.addSuite(suite);
}

