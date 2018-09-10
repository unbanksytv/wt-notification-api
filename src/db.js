const Subscription = require('./models/subscription');

/**
 * Create all necessary tables.
 *
 * @return {Promise<void>}
 */
async function setupDB () {
  await Subscription.createTable();
}

/**
 * Bring the database to the initial empty state.
 *
 * @return {Promise<void>}
 */
async function resetDB () {
  await Subscription.dropTable();
  await setupDB();
}

module.exports = {
  setupDB,
  resetDB,
};
