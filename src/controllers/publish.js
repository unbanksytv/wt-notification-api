const Queue = require('../services/queue');
const { HttpValidationError } = require('../errors');

const validators = require('../services/validators');

/**
 * Publish a new notification.
 */
module.exports.publish = async (req, res, next) => {
  try {
    // 1. Validate request payload.
    validators.validatePublicationRequest(req.body);
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
    if (err instanceof validators.ValidationError) {
      return next(new HttpValidationError('validationFailed', err.message));
    }
    next(err);
  }
};
