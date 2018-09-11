/* eslint-env mocha */
const { assert } = require('chai');
const request = require('supertest');

const Subscription = require('../../src/models/subscription');

function _getSubscriptionData () {
  return {
    wtIndex: '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
    hotel: '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
    action: 'hotelCreated',
    subjects: ['description', 'ratePlans'],
    url: 'https://example.com/',
  };
}

describe('controllers - subscription', function () {
  let server;

  before(async () => {
    server = require('../../src/index');
  });

  after(() => {
    server.close();
  });

  describe('POST /hotels', () => {
    it('should create a new subscription record and return its ID', (done) => {
      const subscriptionData = _getSubscriptionData();

      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(201)
        .expect('content-type', /application\/json/)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            const sub = await Subscription.get(res.body.subscriptionId);
            assert.deepEqual(sub, Object.assign({
              id: res.body.subscriptionId,
              active: true,
            }, subscriptionData));
            done();
          } catch (err) {
            done(err);
          }
        });
    });
  });
});
