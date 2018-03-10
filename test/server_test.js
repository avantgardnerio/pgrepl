var request = require('supertest');
var app = require('../app');

describe('GET /users', function () {
  it('routes correctly', function (done) {
    request(app).get('/users')
      .expect(200, done)
  });
});