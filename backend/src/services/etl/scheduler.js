const cron = require('node-cron');
const logger = require('../../utils/logger');
const DiseaseDataETL = require('./diseaseData');
const WeatherDataETL = require('./weatherData');
const monitor = require('./monitor');

/**
 * ETL Job Scheduler
 * Manages scheduled data ingestion jobs
 */
class ETLScheduler {
  constructor() {
    this.jobs = [];
    this.diseaseETL = new DiseaseDataETL();
    this.weatherETL = new WeatherDataETL();
  }

  /**
   * Schedule disease data ingestion (daily at 2 AM)
   */
  scheduleDiseaseDataIngestion() {
    const job = cron.schedule('0 2 * * *', async () => {
      logger.info('Running scheduled disease data ingestion');
      try {
        const result = await this.diseaseETL.execute();
        monitor.recordJobExecution('diseaseData', 'success', result);
        logger.info('Scheduled disease data ingestion completed');
      } catch (error) {
        monitor.recordJobExecution('diseaseData', 'failed', null, error);
        logger.error(`Scheduled disease data ingestion failed: ${error.message}`);
      }
    });

    this.jobs.push({ name: 'diseaseData', job });
    logger.info('Scheduled disease data ingestion: Daily at 2:00 AM');
  }

  /**
   * Schedule weather data ingestion (every 6 hours)
   */
  scheduleWeatherDataIngestion() {
    const job = cron.schedule('0 */6 * * *', async () => {
      logger.info('Running scheduled weather data ingestion');
      try {
        // Get list of regions from existing cases
        const Case = require('../../models/Case');
        const distinctRegions = await Case.distinct('region');
        const regions = distinctRegions.slice(0, 50).map((r) => ({ name: r }));

        if (regions.length > 0) {
          const result = await this.weatherETL.execute(regions.map((r) => ({ name: r })));
          monitor.recordJobExecution('weatherData', 'success', result);
          logger.info('Scheduled weather data ingestion completed');
        } else {
          logger.warn('No regions found for weather data ingestion');
          monitor.recordJobExecution('weatherData', 'skipped', { message: 'No regions found' });
        }
      } catch (error) {
        monitor.recordJobExecution('weatherData', 'failed', null, error);
        logger.error(`Scheduled weather data ingestion failed: ${error.message}`);
      }
    });

    this.jobs.push({ name: 'weatherData', job });
    logger.info('Scheduled weather data ingestion: Every 6 hours');
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (process.env.ENABLE_ETL_SCHEDULER !== 'false') {
      this.scheduleDiseaseDataIngestion();
      this.scheduleWeatherDataIngestion();
      logger.info('ETL scheduler started');
    } else {
      logger.info('ETL scheduler disabled via ENABLE_ETL_SCHEDULER=false');
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Stopped ETL job: ${name}`);
    });
    this.jobs = [];
  }

  /**
   * Manually trigger disease data ingestion
   */
  async triggerDiseaseDataIngestion() {
    logger.info('Manually triggering disease data ingestion');
    try {
      const result = await this.diseaseETL.execute();
      monitor.recordJobExecution('diseaseData', 'success', result);
      return result;
    } catch (error) {
      monitor.recordJobExecution('diseaseData', 'failed', null, error);
      throw error;
    }
  }

  /**
   * Manually trigger weather data ingestion
   */
  async triggerWeatherDataIngestion(regions = []) {
    logger.info('Manually triggering weather data ingestion');
    
    // If no regions provided, get them from database
    if (!regions || regions.length === 0) {
      const Case = require('../../models/Case');
      const distinctRegions = await Case.distinct('region');
      
      if (distinctRegions && distinctRegions.length > 0) {
        // Limit to first 50 regions if needed
        const limitedRegions = distinctRegions.slice(0, 50);
        regions = limitedRegions.map((r) => ({ name: r }));
        logger.info(`Found ${regions.length} regions from database`);
      } else {
        logger.warn('No regions found in database for weather data ingestion');
        return {
          success: false,
          message: 'No regions found in database. Please seed data first.',
        };
      }
    }
    
    try {
      const result = await this.weatherETL.execute(regions);
      monitor.recordJobExecution('weatherData', 'success', result);
      return result;
    } catch (error) {
      monitor.recordJobExecution('weatherData', 'failed', null, error);
      throw error;
    }
  }
}

module.exports = ETLScheduler;
