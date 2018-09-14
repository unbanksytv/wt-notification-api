const Promise = require('bluebird');
const request = require('request-promise-native');

const config = require('../config');
const Subscription = require('../models/subscription');

/*
 * Returns true if the response conforms to the specified format,
 * false otherwise.
 *
 **/
function _requestAccepted (response) {
  const acceptedMsg = 'notification accepted';
  return (response.status === 200) && (response.body.toLower().trim() === acceptedMsg);
}

/*
 * Sends the notification and returns a flag based on whether it
 * has been accepted or not.
 *
 **/
async function _send (requestLib, notification, url) {
  try {
    const response = await requestLib({
      method: 'POST',
      uri: url,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });
    return _requestAccepted(response);
  } catch (err) {
    // TODO: What about network errors that aren't the
    // subscriber's fault?
    return false;
  }
}

const CONCURRENCY = 16;

module.exports.process = async function (notification, requestLib) {
  requestLib = requestLib || request; // Allow injection from the outside for test purposes.
  const urls = await Subscription.getURLs(notification);
  return Promise.map(Object.keys(urls), async (url) => {
    const accepted = await _send(requestLib, notification, url);
    if (!accepted) {
      for (let id of urls[url]) {
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
