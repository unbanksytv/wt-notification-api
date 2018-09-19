/* eslint-env mocha */
/* eslint-disable promise/no-callback-in-promise */
const { assert } = require('chai');
const request = require('supertest');

const Subscription = require('../../src/models/subscription');

function _getSubscriptionData () {
  return {
    wtIndex: '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
    resourceType: 'hotel',
    resourceAddress: '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
    scope: {
      action: 'update',
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

  describe('POST /subscriptions', () => {
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
              resourceType: subscriptionData.resourceType,
              resourceAddress: subscriptionData.resourceAddress,
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
              resourceType: subscriptionData.resourceType,
              resourceAddress: subscriptionData.resourceAddress,
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

    it('should return 422 when an unknown resourceType is specified', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.resourceType = 'dummy';
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when an unknown property is supplied', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.whatever = 'dummy';
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when the URL is invalid', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.url = '123456';
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when the protocol is missing from the URL', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.url = 'example.com';
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });

    it('should return 422 when an invalid ethereum address is supplied', (done) => {
      const subscriptionData = _getSubscriptionData();
      subscriptionData.resourceAddress = '123456';
      request(server)
        .post('/subscriptions')
        .send(subscriptionData)
        .expect(422)
        .end(done);
    });
  });

  describe('DELETE /subscriptions/:id', () => {
    // Define a dummy valid address.
    const wtIndex = '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b';

    it('should deactivate an existing subscription', (done) => {
      Subscription.create({
        wtIndex,
        resourceType: 'hotel',
        url: 'http://example.com/callback',
      }).then((subscription) => {
        request(server)
          .delete(`/subscriptions/${subscription.id}`)
          .expect(204)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              const sub = await Subscription.get(subscription.id);
              assert.equal(sub.active, false);
              done();
            } catch (err) {
              done(err);
            }
          });
      }).catch(done);
    });

    it('should return 404 when the deleted subscription does not exist', (done) => {
      request(server)
        .delete('/subscriptions/dummy')
        .expect(404)
        .end(done);
    });

    it('should return 404 when the deleted subscription has already been deactivated', (done) => {
      Subscription.create({
        wtIndex,
        resourceType: 'hotel',
        url: 'http://example.com/callback',
        active: false,
      }).then((subscription) => {
        request(server)
          .delete(`/subscriptions/${subscription.id}`)
          .expect(404)
          .end(done);
      }).catch(done);
    });
  });

  describe('GET /subscriptions/:id', () => {
    it('should return an existing subscription', (done) => {
      const subscriptionData = _getSubscriptionData();
      delete subscriptionData.scope;
      Subscription.create(subscriptionData).then((sub) => {
        request(server)
          .get(`/subscriptions/${sub.id}`)
          .expect(200)
          .expect('content-type', /application\/json/)
          .end(async (err, res) => {
            if (err) return done(err);
            try {
              assert.deepEqual(res.body, Object.assign({
                id: sub.id, active: true,
              }, subscriptionData));
              done();
            } catch (err) {
              done(err);
            }
          });
      }).catch(done);
    });

    it('should return 404 when the subscription does not exist', (done) => {
      request(server)
        .get('/subscriptions/dummy')
        .expect(404)
        .end(done);
    });
  });
});
