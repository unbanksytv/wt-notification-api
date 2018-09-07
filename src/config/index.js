const winston = require('winston');

module.exports = {
  port: 8080,
  baseUrl: 'http://localhost:8080',
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
