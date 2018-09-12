const tv4 = require('tv4');

const subscriptionSchema = require('./subscription-schema.json');

class ValidationError extends Error {};
module.exports.ValidationError = ValidationError;

module.exports.validateSubscriptionRequest = function (data) {
  if (!tv4.validate(data, subscriptionSchema, false, true)) {
    const msg = tv4.error.message + ': ' + tv4.error.dataPath;
    throw new ValidationError(msg);
  }
}
