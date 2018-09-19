const tokenThrottle = require('tokenthrottle');

const { HttpTooManyRequestsError } = require('./errors');

module.exports.throttle = function (config) {
  const throttle = tokenThrottle(config);
  return function (req, res, next) {
    throttle.rateLimit(`${req.ip}:${req.path}`, (err, limited) => {
      if (err) return next(err);
      if (limited) {
        return next(new HttpTooManyRequestsError());
      }
      return next();
    });
  };
};
