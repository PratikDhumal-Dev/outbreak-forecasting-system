// Load .env from backend root directory (parent of src/)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http = require('http');

const config = require('./config');
const app = require('./app');
const connectDB = require('./db/connection');
const logger = require('./utils/logger');

const server = http.createServer(app);

// Connect to MongoDB before starting server
connectDB()
  .then(() => {
    server.listen(config.port, () => {
      logger.info(`MedSentinel backend running on port ${config.port}`);

      // Start ETL scheduler
      const ETLScheduler = require('./services/etl/scheduler');
      const scheduler = new ETLScheduler();
      scheduler.start();

      // Start forecast scheduler
      const forecastScheduler = require('./services/forecastScheduler');
      forecastScheduler.start();
    });
  })
  .catch((error) => {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
