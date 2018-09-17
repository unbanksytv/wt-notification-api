const _ = require('lodash'),
  subscriptionSchema = require('./subscription-schema');

const notificationSchema = _.cloneDeep(subscriptionSchema);

// Make the changes that distinguish notifications for
// subscriptions;
delete notificationSchema.properties.url;
notificationSchema.required = ['wtIndex', 'resourceType', 'resourceAddress', 'scope'];

module.exports = notificationSchema;
