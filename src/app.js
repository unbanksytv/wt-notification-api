const path = require('path');

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const YAML = require('yamljs');

const config = require('./config');
const { version } = require('../package.json');
const { HttpError, HttpInternalError, Http404Error, HttpBadRequestError } = require('./errors');
const middleware = require('./middleware');
const subscriptions = require('./controllers/subscriptions');
const notifications = require('./controllers/notifications');

const app = express();

// No need to leak information and waste bandwith with this header.
app.disable('x-powered-by');

// Swagger docs.
const swaggerDocument = YAML.load(path.resolve('./docs/swagger.yaml'));
swaggerDocument.servers = [{ url: config.baseUrl }];
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

app.use(bodyParser.json());
app.use((err, req, res, next) => {
  // Catch and handle bodyParser errors.
  if (err.statusCode === 400 && err.type === 'entity.parse.failed') {
    return next(new HttpBadRequestError('badRequest', 'Invalid JSON.'));
  }
  next(err);
});

// Logg HTTP requests.
app.use(morgan(':remote-addr :remote-user [:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
  stream: {
    write: (msg) => config.logger.info(msg),
  },
}));

// Root handler
app.get('/', (req, res) => {
  res.status(200).json({
    docs: `${config.baseUrl}/docs/`,
    info: 'https://github.com/windingtree/wt-update-api/blob/master/README.md',
    version,
    config: process.env.WT_CONFIG,
  });
});

// Subscriptions
app.post('/subscriptions', middleware.throttle({
  rate: 1000,
  window: 60 * 1000 * 20, // 20 minutes
}), subscriptions.create);
app.get('/subscriptions/:id', subscriptions.get);
app.delete('/subscriptions/:id', subscriptions.deactivate);

// Notifications
app.post('/notifications', notifications.validate, middleware.throttle({
  rate: 100,
  window: 60 * 1000, // 100 updates per minute per hotel
  getId: (req) => `${req.body.wtIndex}:${req.body.resourceAddress}:${req.path}`,
}), notifications.publish);

// 404 handler
app.use('*', (req, res, next) => {
  next(new Http404Error());
});

// Error handler
app.use((err, req, res, next) => {
  if (!(err instanceof HttpError)) {
    config.logger.error(err.stack);
    err = new HttpInternalError();
  }
  res.status(err.status).json(err.toPlainObject());
});

module.exports = {
  app,
};
