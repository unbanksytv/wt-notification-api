const Subscription = require('../models/subscription');
const { HttpValidationError } = require('../errors');

const validators = require('../validators');

/**
 * Create a new subscription.
 */
module.exports.createSubscription = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    validators.validateSubscriptionRequest(req.body);
    // 2. Save the new subscription.
    // (Note: some validations are here as well.)
    let { id: subscriptionId } = await Subscription.create({
      wtIndex: req.body.wtIndex,
      hotel: req.body.hotel,
      action: req.body.scope ? req.body.scope.action : null,
      subjects: req.body.scope ? req.body.scope.subjects : null,
      url: req.body.url,
    });
    // 3. Return the subscription id.
    res.status(201).json({ subscriptionId });
  } catch (err) {
    if (err instanceof validators.ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};
