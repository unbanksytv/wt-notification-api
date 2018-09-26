const tv4 = require('tv4');
const validator = require('validator');
const web3 = require('web3');

const subscriptionSchema = require('./subscription-schema.js');
const notificationSchema = require('./notification-schema.js');

tv4.addFormat('url', (data) => {
  const opts = { 'require_protocol': true, 'require_tld': false };
  if (validator.isURL(data, opts)) {
    return null;
  }
  return 'Not a valid URL.';
});

tv4.addFormat('eth-address', (data) => {
  if (web3.utils.isAddress(data)) {
    return null;
  }
  return 'Invalid ethereum address.';
});

class ValidationError extends Error {};
module.exports.ValidationError = ValidationError;

function _validate (data, schema) {
  if (!tv4.validate(data, schema, false, true)) {
    const msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
}

module.exports.validateSubscriptionRequest = function (data) {
  return _validate(data, subscriptionSchema);
};

module.exports.validatePublicationRequest = function (data) {
  return _validate(data, notificationSchema);
};
