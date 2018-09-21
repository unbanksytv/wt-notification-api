const winston = require('winston');
const knex = require('knex');

module.exports = {
  db: knex({
    client: 'sqlite3',
    connection: {
      filename: './.playground.sqlite',
    },
    useNullAsDefault: true,
  }),
  logger: winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
        stderrLevels: ['error'],
      }),
    ],
  }),
};
