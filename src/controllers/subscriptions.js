const Subscription = require('../models/subscription');
const { HttpValidationError } = require('../errors');

/**
 * Create a new subscription.
 */
module.exports.createSubscription = async (req, res, next) => {
  try {
    // 1. Validate request payload. TODO
    // 2. Save the new subscription.
    // (Note: some validations are here as well.)
    let { id: subscriptionId } = await Subscription.create({
      wtIndex: req.body.wtIndex,
      hotel: req.body.hotel,
      action: req.body.action,
      subjects: req.body.subjects,
      url: req.body.url,
    });
    // 3. Return the subscription id.
    res.status(201).json({ subscriptionId });
  } catch (err) {
    if (err instanceof Subscription.ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};
