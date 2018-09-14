/* eslint-env mocha */
const { assert } = require('chai');
const sinon = require('sinon');

const { resetDB } = require('../../src/db');
const Subscription = require('../../src/models/subscription');
const worker = require('../../src/services/worker');

// Define some dummy valid addresses.
const wtIndex = '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
  resourceType = 'hotel',
  resourceAddress = '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a';

describe('services - worker', () => {
  let requestMock;
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
    requestMock = sinon.stub().callsFake(() => Promise.resolve({
      status: 200,
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
      assert.equal(requestMock.args[0][0].body, JSON.stringify(notification));
    });
  });
});
