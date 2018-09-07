const path = require('path');
const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const YAML = require('yamljs');

const config = require('./config');
const { version } = require('../package.json');

const app = express();

// No need to leak information and waste bandwith with this header.
app.disable('x-powered-by');

// Swagger docs.
const swaggerDocument = YAML.load(path.resolve('./docs/swagger.yaml'));
swaggerDocument.servers = [{ url: config.baseUrl }];
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

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
    info: 'https://github.com/windingtree/wt-write-api/blob/master/README.md',
    version,
    config: process.env.WT_CONFIG,
    wtIndexAddress: config.wtIndexAddress,
  });
});

module.exports = {
  app,
};
