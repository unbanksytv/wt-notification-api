const web3 = require('web3');

const { db } = require('../config');

const SUBSCRIPTIONS_TABLE = 'subscriptions';
const SUBJECTS_TABLE = 'subjects';

const ACTIONS = [
    'hotelCreated',
    'hotelUpdated',
    'hotelDeleted',
  ],
  SUBJECTS = [
    'ratePlans',
    'availability',
    'description',
    'notifications',
  ];

module.exports.createTable = async function () {
  await db.schema.createTable(SUBSCRIPTIONS_TABLE, (table) => {
    table.increments().primary();
    table.string('wt_index', 63).notNullable();
    table.string('hotel', 63);
    table.string('action', 63);
    table.text('url').notNullable();
    table.boolean('active').notNullable().defaultTo(true);
    table.timestamps();
  });

  await db.schema.createTable(SUBJECTS_TABLE, (table) => {
    table.increments().primary();
    table.string('name', 63);
    table.integer('subscription_id').unsigned().notNullable();

    table.foreign('subscription_id').references('id').inTable(SUBSCRIPTIONS_TABLE);
    table.unique(['name', 'subscription_id']);
  });
};

module.exports.dropTable = async function () {
  await db.schema.dropTableIfExists(SUBJECTS_TABLE);
  await db.schema.dropTableIfExists(SUBSCRIPTIONS_TABLE);
};

function _normalize (data) {
  data = Object.assign({}, data);
  data.active = (data.active === undefined) ? true : Boolean(data.active);
  for (let field of ['hotel', 'action', 'subjects']) {
    if (([null, undefined, ''].indexOf(data[field]) !== -1) || (data[field].length === 0)) {
      delete data[field];
    }
  }
  return data;
}

class ValidationError extends Error {};

function _validate (data) {
  if (data.action && ACTIONS.indexOf(data.action) === -1) {
    throw new ValidationError(`Unknown action: ${data.action}`);
  }
  if (data.subjects) {
    for (let subject of data.subjects) {
      if (SUBJECTS.indexOf(subject) === -1) {
        throw new ValidationError(`Unknown subject: ${subject}`);
      }
    }
  }
  if (data.wtIndex && !web3.utils.isAddress(data.wtIndex)) {
    throw new ValidationError(`Invalid address: ${data.wtIndex}`);
  }
  if (data.hotel && !web3.utils.isAddress(data.hotel)) {
    throw new ValidationError(`Invalid address: ${data.hotel}`);
  }
}

/**
 * Create a new subject-subscription binding.
 *
 * @param {String} name
 * @param {String} subscriptionid
 * @return {Promise<Object>}
 */
async function addSubject (name, subscriptionId) {
  await db(SUBJECTS_TABLE).insert({
    'name': name,
    'subscription_id': subscriptionId,
  });
  return { name, subscriptionId };
};

/**
 * Create a new subscription and return its representation.
 *
 * @param {Object} subscriptionData
 * @return {Promise<Object>}
 */
module.exports.create = async function (subscriptionData) {
  subscriptionData = _normalize(subscriptionData);
  _validate(subscriptionData);
  const subscriptionId = (await db(SUBSCRIPTIONS_TABLE).insert({
    'wt_index': subscriptionData.wtIndex,
    'hotel': subscriptionData.hotel,
    'action': subscriptionData.action,
    'url': subscriptionData.url,
    'active': subscriptionData.active,
  }))[0];
  for (let subject of (subscriptionData.subjects || [])) {
    await addSubject(subject, subscriptionId);
  }
  return Object.assign({ id: subscriptionId }, subscriptionData);
};

/**
 * Get a subscription by its ID.
 *
 * @param {Number} ID
 * @return {Promise<Object>}
 */
module.exports.get = async function (id) {
  const subscription = (await db(SUBSCRIPTIONS_TABLE).select('id', 'wt_index', 'hotel', 'action', 'url', 'active').where({
      'id': id,
    }))[0],
    subjects = (await db(SUBJECTS_TABLE).select('name').where({
      'subscription_id': id,
    })).map((x) => x.name);
  return subscription && _normalize({
    id: subscription.id,
    wtIndex: subscription.wt_index,
    hotel: subscription.hotel,
    action: subscription.action,
    url: subscription.url,
    active: subscription.active,
    subjects: subjects,
  });
};

module.exports.ValidationError = ValidationError;
