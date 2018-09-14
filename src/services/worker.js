const Promise = require('bluebird');
const request = require('request-promise-native');

const config = require('../config');
const Subscription = require('../models/subscription');

async function _sendNotification (requestLib, notification, url) {
  try {
    await requestLib({
      method: 'POST',
      uri: url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
  } catch (err) {
    // TODO: deactivate subscription upon invalid response.
  }
}

const CONCURRENCY = 8;

module.exports.process = async function (notification, requestLib) {
  requestLib = requestLib || request; // Allow injection from the outside for test purposes.
  const urls = await Subscription.getURLs(notification);
  return Promise.map(urls, (url) => {
    return _sendNotification(requestLib, notification, url);
  }, { concurrency: CONCURRENCY }).catch((err) => {
    // Catch rejections to prevent the whole node process from
    // crashing.
    config.logger.error(err.stack);
  });
};
