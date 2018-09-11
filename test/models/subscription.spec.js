/* eslint-env mocha */
const { assert } = require('chai');

const Subscription = require('../../src/models/subscription');

// Define some dummy valid addresses.
const wtIndex = '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
  hotel = '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a';

describe('models - subscription', () => {
  describe('create', () => {
    it('should create a new subscription and return its representation', async () => {
      const subscription = await Subscription.create({
        wtIndex,
        hotel,
        action: 'hotelCreated',
        subjects: ['description', 'ratePlans'],
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.property(subscription, 'wtIndex', wtIndex);
      assert.property(subscription, 'hotel', hotel);
      assert.property(subscription, 'action', 'hotelUpdated');
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.property(subscription, 'subjects', ['description', 'ratePlans']);
      assert.property(subscription, 'active', true);
    });

    it('should work without optional attributes', async () => {
      const subscription = await Subscription.create({
        wtIndex,
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.property(subscription, 'wtIndex', wtIndex);
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.property(subscription, 'active', true);
      assert.equal(subscription.hotel, undefined);
      assert.equal(subscription.action, undefined);
      assert.equal(subscription.subjects, undefined);
    });

    it('should raise an error when action is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          url: 'http://example.com/callback',
          action: 'hotelOuch',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, Subscription.ValidationError);
        assert.match(err.message, /^Unknown action/);
      }
    });

    it('should raise an error when subject is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          url: 'http://example.com/callback',
          action: 'hotelUpdated',
          subjects: ['dummy'],
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, Subscription.ValidationError);
        assert.match(err.message, /^Unknown subject/);
      }
    });

    it('should raise an error upon an invalid ethereum address', async () => {
      try {
        await Subscription.create({
          wtIndex: 'dummy',
          url: 'http://example.com/callback',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, Subscription.ValidationError);
      }
    });
  });

  describe('get', () => {
    it('should get a previously created subscription', async () => {
      const data = {
          wtIndex,
          hotel,
          action: 'hotelDeleted',
          subjects: ['ratePlans'],
          url: 'http://example.com/callback',
        },
        { id } = await Subscription.create(data),
        subscription = await Subscription.get(id);
      assert.deepEqual(subscription, Object.assign({ id, active: true }, data));
    });

    it('should normalize falsy values', async () => {
      const data = {
          wtIndex,
          hotel: undefined,
          action: null,
          subjects: [],
          url: 'http://example.com/callback',
          active: false,
        },
        { id } = await Subscription.create(data),
        subscription = await Subscription.get(id);
      assert.deepEqual(subscription, {
        id,
        wtIndex,
        url: 'http://example.com/callback',
        active: false,
      });
    });

    it('should return undefined if no such account exists', async () => {
      const subscription = await Subscription.get(9923448);
      assert.equal(subscription, undefined);
    });
  });
});
