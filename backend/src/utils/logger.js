const pino = require('pino');
const config = require('../config');

// Simple logger configuration compatible with older Node versions
const logger = pino({
  level: config.logLevel || 'info',
  // Remove transport to avoid compatibility issues
  // Can add pino-pretty later if needed: npm install -D pino-pretty
});

module.exports = logger;
