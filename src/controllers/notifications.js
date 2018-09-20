const Queue = require('../services/queue');
const { HttpValidationError } = require('../errors');

const validators = require('../services/validators');

/**
 * Validate notification request.
 *
 * NOTE: This is split to a separate function to allow the
 * throttling middleware to be put in between request validation
 * and the actual publication.
 */
module.exports.validate = (req, res, next) => {
  try {
    // 1. Validate request payload.
    validators.validatePublicationRequest(req.body);
    next();
  } catch (err) {
    if (err instanceof validators.ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};

/**
 * Publish a new notification.
 */
module.exports.publish = (req, res, next) => {
  try {
    // 2. Push the notification.
    const queue = Queue.get();
    queue.enqueue({
      wtIndex: req.body.wtIndex,
      resourceType: req.body.resourceType,
      resourceAddress: req.body.resourceAddress,
      action: req.body.scope.action,
      subjects: req.body.scope.subjects,
    });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
