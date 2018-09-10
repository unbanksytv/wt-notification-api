/* eslint-env mocha */
const { assert } = require('chai');

const Subscription = require('../../src/models/subscription');

describe('models - subscription', () => {
  describe('create', () => {
    it('should create a new subscription and return its representation', async () => {
      const subscription = await Subscription.create({
        wtIndex: '0xwtindex',
        hotelAddress: '0xhoteladdress',
        action: 'hotelCreated',
        subjects: ['description', 'ratePlans'],
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.property(subscription, 'wtIndex', '0xwtindex');
      assert.property(subscription, 'hotelAddress', '0xhoteladdress');
      assert.property(subscription, 'action', 'hotelUpdated');
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.property(subscription, 'subjects', ['description', 'ratePlans']);
    });

    it('should work without optional attributes', async () => {
      const subscription = await Subscription.create({
        wtIndex: '0xwtindex',
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.property(subscription, 'wtIndex', '0xwtindex');
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.equal(subscription.hotelAddress, undefined);
      assert.equal(subscription.action, undefined);
      assert.equal(subscription.subjects, undefined);
    });
  });

  describe('get', () => {
    it('should get a previously created subscription', async () => {
      const { id } = await Subscription.create({
        wtIndex: '0xwtindex',
        hotelAddress: '0xhoteladdress',
        action: 'hotelDeleted',
        subjects: ['ratePlans'],
        url: 'http://example.com/callback',
      });
      const subscription = await Subscription.get(id);
      assert.deepEqual(subscription, {
        id,
        wtIndex: '0xwtindex',
        hotelAddress: '0xhoteladdress',
        action: 'hotelDeleted',
        subjects: ['ratePlans'],
        url: 'http://example.com/callback',
      });
    });

    it('should return undefined if no such account exists', async () => {
      const subscription = await Subscription.get(9923448);
      assert.equal(subscription, undefined);
    });
  });
});
