/* eslint-env mocha */
const { assert } = require('chai');
const request = require('supertest');

const Subscription = require('../../src/models/subscription');

function _getSubscriptionData () {
  return {
    wtIndex: '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
    hotel: '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
    scope: {
      action: 'hotelUpdated',
      subjects: ['description', 'ratePlans'],
    },
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
            assert.deepEqual(sub, {
              id: res.body.subscriptionId,
              active: true,
              url: subscriptionData.url,
              wtIndex: subscriptionData.wtIndex,
              hotel: subscriptionData.hotel,
              action: subscriptionData.scope.action,
              subjects: subscriptionData.scope.subjects,
            });
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should accept a subscription without scope', (done) => {
      const subscriptionData = _getSubscriptionData();
      delete subscriptionData.scope;

      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(201)
        .expect('content-type', /application\/json/)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            const sub = await Subscription.get(res.body.subscriptionId);
            assert.deepEqual(sub, {
              id: res.body.subscriptionId,
              active: true,
              url: subscriptionData.url,
              wtIndex: subscriptionData.wtIndex,
              hotel: subscriptionData.hotel,
            });
            done();
          } catch (err) {
            done(err);
          }
        });
    });

    it('should return 422 when a required attribute is missing', (done) => {
      const subscriptionData = _getSubscriptionData();
      delete subscriptionData.url;
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when an unknown subject is specified', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.scope.subjects = ['dummy'];
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when an unknown action is specified', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.scope.action = ['dummy'];
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });
  });
});