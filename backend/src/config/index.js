const REQUIRED_ENV_VARS = ['PORT', 'LOG_LEVEL', 'CORS_ORIGIN'];

const loadEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => typeof process.env[key] === 'undefined');

  if (missing.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `Missing environment variables: ${missing.join(
        ', '
      )}. Using default values where applicable.`
    );
  }

  return {
    port: process.env.PORT || 4000,
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medsentinel',
    forecastingServiceUrl: process.env.FORECASTING_SERVICE_URL || 'http://localhost:5000',
  };
};

module.exports = loadEnv();



