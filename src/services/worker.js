const Promise = require('bluebird');
const request = require('request-promise-native');

const config = require('../config');
const { Subscription } = require('../models/subscription');

async function _sendNotification (notification, url) {
  try {
    await request({
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

module.exports.process = async function (notification) {
  const urls = await Subscription.getURLs(notification);
  return Promise.map(urls, (url) => _sendNotification(notification, url), CONCURRENCY)
    // Catch rejections to prevent the whole node process from
    // crashing.
    .catch((err) => {
      config.logger.error(err.stack);
    });
};
