const Subscription = require('../models/subscription');
const { HttpValidationError, Http404Error } = require('../errors');

const validators = require('../services/validators');

/**
 * Create a new subscription.
 */
module.exports.create = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    validators.validateSubscriptionRequest(req.body);
    // 2. Save the new subscription.
    let { id: subscriptionId } = await Subscription.create({
      wtIndex: req.body.wtIndex,
      resourceType: req.body.resourceType,
      resourceAddress: req.body.resourceAddress,
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

/**
 * Deactivate a subscription.
 */
module.exports.deactivate = async (req, res, next) => {
  const deactivated = await Subscription.deactivate(req.params.id);
  if (deactivated) {
    res.sendStatus(204);
  } else {
    next(new Http404Error('notFound', `No active subscription with ID ${req.params.id} found.`));
  }
};

/**
 * Get an existing description.
 */
module.exports.get = async (req, res, next) => {
  try {
    const sub = await Subscription.get(req.params.id);
    if (!sub) {
      throw new Http404Error('notFound', `No subscription with ID ${req.params.id} found.`);
    }
    const data = {
      id: sub.id,
      wtIndex: sub.wtIndex,
      resourceType: sub.resourceType,
      url: sub.url,
      active: sub.active,
    };
    if (sub.resourceAddress) {
      data.resourceAddress = sub.resourceAddress;
    }
    if (sub.action) {
      data.scope = {
        action: sub.action,
      };
      if (sub.subjects && sub.subjects.length > 0) {
        data.scope.subjects = sub.subjects;
      }
    }
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};
