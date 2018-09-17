const Promise = require('bluebird');
const request = require('request-promise-native');

const config = require('../config');
const Subscription = require('../models/subscription');

/*
 * Returns true if the response conforms to the specified format,
 * false otherwise.
 *
 **/
const ACCEPTED_MSG = 'notification accepted';
function _requestAccepted (response) {
  return (response.statusCode === 200) && (response.body.toLowerCase().trim() === ACCEPTED_MSG);
}

/*
 * Sends the notification and returns a flag based on whether it
 * has been accepted or not.
 *
 **/
async function _send (requestLib, notification, url) {
  let response;
  try {
    response = await requestLib({
      method: 'POST',
      uri: url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
      resolveWithFullResponse: true
    });
  } catch (err) {
    return false;
  }
  return _requestAccepted(response);
}

const CONCURRENCY = 16;

module.exports.process = async function (notification, requestLib) {
  requestLib = requestLib || request; // Allow injection from the outside for test purposes.
  const urls = await Subscription.getURLs(notification);
  return Promise.map(Object.keys(urls), async (url) => {
    const accepted = await _send(requestLib, notification, url);
    if (!accepted) {
      for (let id of urls[url]) {
        config.logger.info(`Deactivating subscription: ${id}`);
        // Deactivate subscription when not able to fulfill it.
        await Subscription.deactivate(id);
      }
    }
  }, { concurrency: CONCURRENCY }).catch((err) => {
    // Catch rejections to prevent the whole node process from
    // crashing.
    config.logger.error(err.stack);
  });
};
