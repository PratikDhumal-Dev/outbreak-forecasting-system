const logger = require('../../utils/logger');

/**
 * Base ETL service class
 * Provides common functionality for data extraction, transformation, and loading
 */
class BaseETLService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = logger.child({ service: serviceName });
  }

  /**
   * Extract data from source
   * Override in subclasses
   */
  async extract() {
    throw new Error('extract() must be implemented by subclass');
  }

  /**
   * Transform raw data into standardized format
   * Override in subclasses
   */
  async transform(rawData) {
    throw new Error('transform() must be implemented by subclass');
  }

  /**
   * Load transformed data into database
   * Override in subclasses
   */
  async load(transformedData) {
    throw new Error('load() must be implemented by subclass');
  }

  /**
   * Execute full ETL pipeline
   */
  async execute() {
    try {
      this.logger.info('Starting ETL pipeline');
      const rawData = await this.extract();
      const transformedData = await this.transform(rawData);
      const result = await this.load(transformedData);
      this.logger.info('ETL pipeline completed successfully');
      return result;
    } catch (error) {
      this.logger.error(`ETL pipeline failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Validate data before loading
   */
  validate(data) {
    if (!data || !Array.isArray(data)) {
      throw new Error('Data must be a non-empty array');
    }
    return true;
  }
}

module.exports = BaseETLService;
