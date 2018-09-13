/* eslint-env mocha */
const { assert } = require('chai');
const sinon = require('sinon');
const request = require('supertest');

const Queue = require('../../src/services/queue');

function _getNotificationData () {
  return {
    wtIndex: '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
    resourceType: 'hotel',
    resourceAddress: '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
    scope: {
      action: 'update',
      subjects: ['description', 'ratePlans'],
    },
  };
}

describe('controllers - notifications', function () {
  const queue = Queue.get();
  let server;

  before(async () => {
    server = require('../../src/index');
    sinon.spy(queue, 'enqueue');
  });

  after(() => {
    server.close();
    queue.enqueue.restore();
  });

  describe('POST /notifications', () => {
    it('should accept the notification and enqueue it for broadcast', (done) => {
      const notification = _getNotificationData();
      queue.enqueue.resetHistory();
      assert.equal(queue.enqueue.callCount, 0);
      request(server)
        .post('/notifications')
        .send(notification)
        .expect(204)
        .end(async (err, res) => {
          if (err) return done(err);
          try {
            assert.equal(queue.enqueue.callCount, 1);
            assert.deepEqual(queue.enqueue.args[0][0], {
              wtIndex: notification.wtIndex,
              resourceType: notification.resourceType,
              resourceAddress: notification.resourceAddress,
              action: notification.scope.action,
              subjects: notification.scope.subjects,
            });
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    it('should return 422 if a required attribute is missing', (done) => {
      const notification = _getNotificationData();
      delete notification.resourceAddress;
      request(server)
        .post('/notifications')
        .send(notification)
        .expect(422)
        .end(done);
    });

    it('should return 422 if an invalid address is specified', (done) => {
      const notification = _getNotificationData();
      notification.resourceAddresss = 'dummy';
      request(server)
        .post('/notifications')
        .send(notification)
        .expect(422)
        .end(done);
    });

    it('should return 422 if an invalid enum value is specified', (done) => {
      const notification = _getNotificationData();
      notification.action = 'dummy';
      request(server)
        .post('/notifications')
        .send(notification)
        .expect(422)
        .end(done);
    });
  });
});
