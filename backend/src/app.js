const express = require('express');
const cors = require('cors');
const pino = require('pino');

const config = require('./config');
const apiRouter = require('./routes');
const notFoundHandler = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const logger = pino({ level: config.logLevel });

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use((req, res, next) => {
  req.log = logger.child({ reqId: req.headers['x-request-id'] || Date.now() });
  next();
});
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
