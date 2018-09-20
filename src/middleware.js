const tokenThrottle = require('tokenthrottle');

const { HttpTooManyRequestsError } = require('./errors');

module.exports.throttle = function (config) {
  const throttle = tokenThrottle(config),
    getId = config.getId || ((req) => `${req.ip}:${req.path}`);
  return function (req, res, next) {
    throttle.rateLimit(getId(req), (err, limited) => {
      if (err) return next(err);
      if (limited) {
        return next(new HttpTooManyRequestsError());
      }
      return next();
    });
  };
};
