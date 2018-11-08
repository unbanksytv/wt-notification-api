const { app } = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  config.logger.info(`WT Notification API at ${config.port}...`);
});

module.exports = server;
