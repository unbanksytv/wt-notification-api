/* eslint-env mocha */
/* eslint-disable no-unused-vars */
const { assert } = require('chai');

const { resetDB } = require('../../src/db');
const Subscription = require('../../src/models/subscription');
const { ValidationError } = require('../../src/services/validators');

// Define some dummy valid addresses.
const wtIndex = '0x7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b',
  resourceType = 'hotel',
  resourceAddress = '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a';

describe('models - subscription', () => {
  describe('create', () => {
    it('should create a new subscription and return its representation', async () => {
      const subscription = await Subscription.create({
        wtIndex,
        resourceType,
        resourceAddress,
        action: 'create',
        subjects: ['description', 'ratePlans'],
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.equal(subscription.id.length, 32);
      assert.property(subscription, 'wtIndex', wtIndex);
      assert.property(subscription, 'resourceType', resourceType);
      assert.property(subscription, 'resourceAddress', resourceAddress);
      assert.property(subscription, 'action', 'update');
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.property(subscription, 'subjects', ['description', 'ratePlans']);
      assert.property(subscription, 'active', true);
    });

    it('should work without optional attributes', async () => {
      const subscription = await Subscription.create({
        wtIndex,
        resourceType,
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'id');
      assert.property(subscription, 'wtIndex', wtIndex);
      assert.property(subscription, 'resourceType', resourceType);
      assert.property(subscription, 'url', 'http://example.com/callback');
      assert.property(subscription, 'active', true);
      assert.equal(subscription.hotel, undefined);
      assert.equal(subscription.action, undefined);
      assert.equal(subscription.subjects, undefined);
    });

    it('should raise an error when resource type is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          resourceType: 'train',
          url: 'http://example.com/callback',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
        assert.match(err.message, /^Unknown resourceType/);
      }
    });

    it('should raise an error when action is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          resourceType,
          url: 'http://example.com/callback',
          action: 'hotelOuch',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
        assert.match(err.message, /^Unknown action/);
      }
    });

    it('should raise an error when subject is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          resourceType,
          url: 'http://example.com/callback',
          action: 'update',
          subjects: ['dummy'],
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
        assert.match(err.message, /^Unknown subject/);
      }
    });

    it('should raise an error when an attribute is unknown', async () => {
      try {
        const subscription = await Subscription.create({
          wtIndex,
          resourceTypeWhatever: resourceType,
          url: 'http://example.com/callback',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
      }
    });

    it('should raise an error when resource type is unknown ', async () => {
      try {
        await Subscription.create({
          wtIndex,
          resourceType: 'train',
          url: 'http://example.com/callback',
        });
        throw new Error('Should have raised an error.');
      } catch (err) {
        assert.instanceOf(err, ValidationError);
        assert.match(err.message, /^Unknown resourceType/);
      }
    });

  });

  describe('get', () => {
    it('should get a previously created subscription', async () => {
      const data = {
          wtIndex,
          resourceType,
          resourceAddress,
          action: 'delete',
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
          resourceType,
          resourceAddress: undefined,
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
        resourceType,
        url: 'http://example.com/callback',
        active: false,
      });
    });

    it('should return undefined if no such account exists', async () => {
      const subscription = await Subscription.get(9923448);
      assert.equal(subscription, undefined);
    });
  });

  describe('deactivate', () => {
    it('should deactivate an existing Subscription', async () => {
      let subscription = await Subscription.create({
        wtIndex,
        resourceType,
        url: 'http://example.com/callback',
      });
      assert.property(subscription, 'active', true);
      await Subscription.deactivate(subscription.id);
      subscription = await Subscription.get(subscription.id);
      assert.property(subscription, 'active', false);
    });

    it('should return boolean based on whether the deactivation was successful or not', async () => {
      const subscription = await Subscription.create({
        wtIndex,
        resourceType,
        url: 'http://example.com/callback',
      });
      let deactivated = (await Subscription.deactivate(subscription.id));
      assert.equal(deactivated, true);
      deactivated = (await Subscription.deactivate(subscription.id));
      assert.equal(deactivated, false); // Second deactivation did noting.
      deactivated = (await Subscription.deactivate('nonexistent'));
      assert.equal(deactivated, false);
    });
  });

  describe('getURLs', () => {
    const address1 = '0x6a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a4a',
      address2 = '0x6b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b';
    let s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

    before(async () => {
      await resetDB();
      const base = { wtIndex, resourceType };
      s1 = await Subscription.create(Object.assign({
        resourceAddress: address1,
        url: 'http://example1.com',
      }, base));
      s2 = await Subscription.create(Object.assign({
        resourceAddress: address2,
        url: 'http://example2.com',
        action: 'create',
      }, base));
      s3 = await Subscription.create(Object.assign({ // Intentionally duplicate
        resourceAddress: address2,
        url: 'http://example2.com',
        action: 'create',
      }, base));
      s4 = await Subscription.create(Object.assign({
        resourceAddress: address2,
        url: 'http://example3.com',
        action: 'update',
      }, base));
      s5 = await Subscription.create(Object.assign({
        resourceAddress: address2,
        url: 'http://example4.com',
        action: 'update',
        subjects: ['ratePlans', 'description'],
      }, base));
      s6 = await Subscription.create(Object.assign({
        resourceAddress: address2,
        url: 'http://example5.com',
        action: 'update',
        subjects: ['availability'],
      }, base));
      s7 = await Subscription.create(Object.assign({
        url: 'http://example6.com',
      }, base));
      s8 = await Subscription.create(Object.assign({
        action: 'update',
        url: 'http://example7.com',
      }, base));
      s9 = await Subscription.create(Object.assign({
        action: 'delete',
        url: 'http://example8.com',
      }, base));
      s10 = await Subscription.create(Object.assign({
        action: 'create',
        url: 'http://example9.com',
        active: false,
      }, base));
    });

    it('should return the set URLs with corresponding IDs based on the given criteria', async () => {
      const urls = await Subscription.getURLs({
        wtIndex,
        resourceType,
        resourceAddress: address2,
        action: 'update',
        subjects: ['ratePlans'],
      });
      assert.deepEqual(urls, {
        'http://example3.com': [s4.id],
        'http://example4.com': [s5.id],
        'http://example6.com': [s7.id],
        'http://example7.com': [s8.id],
      });
    });

    it('should work with multiple subjects', async () => {
      const urls = await Subscription.getURLs({
        wtIndex,
        resourceType,
        resourceAddress: address2,
        action: 'update',
        subjects: ['ratePlans', 'availability'],
      });
      assert.deepEqual(urls, {
        'http://example3.com': [s4.id],
        'http://example4.com': [s5.id],
        'http://example5.com': [s6.id],
        'http://example6.com': [s7.id],
        'http://example7.com': [s8.id],
      });
    });

    it('should work without subject', async () => {
      const urls = await Subscription.getURLs({
        wtIndex,
        resourceType,
        resourceAddress: address2,
        action: 'delete',
      });
      assert.deepEqual(urls, {
        'http://example6.com': [s7.id],
        'http://example8.com': [s9.id],
      });
    });

    it('should return all IDs belonging to a given URL', async () => {
      const urls = await Subscription.getURLs({
        wtIndex,
        resourceType,
        resourceAddress: address2,
        action: 'create',
      });
      assert.deepEqual(urls, {
        'http://example2.com': [s2.id, s3.id],
        'http://example6.com': [s7.id],
      });
    });
  });
});
