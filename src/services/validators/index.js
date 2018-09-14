const tv4 = require('tv4');
const tv4Formats = require('tv4-formats');

const subscriptionSchema = require('./subscription-schema.json');
const publicationSchema = require('./publication-schema.json');

tv4.addFormat(tv4Formats); // We use the "url" format.

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
  return _validate(data, publicationSchema);
};
