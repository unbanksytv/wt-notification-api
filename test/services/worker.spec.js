/* eslint-env mocha */
const { assert } = require('chai');
const sinon = require('sinon');

const { resetDB } = require('../../src/db');
const Subscription = require('../../src/models/subscription');
const worker = require('../../src/services/worker');

// Define some dummy valid addresses.
const wtIndex = '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
  resourceType = 'hotel',
  resourceAddress = '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
  resourceAddress2 = '0x8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c';

describe('services - worker', () => {
  let requestMock,
    toDeactivateId;

  before(async () => {
    await resetDB();
    const base = { wtIndex, resourceType };
    await Subscription.create(Object.assign({
      url: 'http://example1.com',
    }, base));
    await Subscription.create(Object.assign({
      resourceAddress,
      url: 'http://example2.com',
      action: 'create',
    }, base));
    await Subscription.create(Object.assign({
      resourceAddress,
      url: 'http://example3.com',
      action: 'create',
    }, base));
    toDeactivateId = (await Subscription.create(Object.assign({
      resourceAddress: resourceAddress2,
      url: 'http://example4.com',
      action: 'create',
    }, base))).id;
    requestMock = sinon.stub().callsFake((opts) => Promise.resolve({
      statusCode: (opts.uri === 'http://example4.com') ? 404 : 200,
      body: 'notification accepted',
    }));
  });

  describe('process', () => {
    it('should send the notification to all appropriate urls', async () => {
      const notification = {
        wtIndex,
        resourceType,
        resourceAddress,
        action: 'create',
      };
      await worker.process(notification, requestMock);
      assert.equal(requestMock.callCount, 3);
      const urls = requestMock.args.map((x) => x[0].uri);
      assert.deepEqual(urls, ['http://example1.com', 'http://example2.com', 'http://example3.com']);
      assert.equal(requestMock.args[0][0].body, JSON.stringify({
        wtIndex,
        resourceType,
        resourceAddress,
        scope: {
          action: 'create',
        },
      }));
    });

    it('should deactivate subscriptions when the endpoint does not respond with `accepted`', async () => {
      const notification = {
        wtIndex,
        resourceType,
        resourceAddress: resourceAddress2,
        action: 'create',
      };
      await worker.process(notification, requestMock);
      const sub = await Subscription.get(toDeactivateId);
      assert.equal(sub.active, false);
    });
  });
});
