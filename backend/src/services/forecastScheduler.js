const cron = require('node-cron');
const logger = require('../utils/logger');
const forecastingService = require('./forecasting');
const Case = require('../models/Case');
const monitor = require('./etl/monitor');

/**
 * Forecast Scheduler
 * Automatically generates forecasts for all regions on a schedule
 */
class ForecastScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Schedule daily forecast generation (runs at 3 AM, after disease data ingestion)
   */
  scheduleDailyForecasts() {
    const job = cron.schedule('0 3 * * *', async () => {
      logger.info('Running scheduled daily forecast generation');
      try {
        const result = await this.generateAllForecasts();
        monitor.recordJobExecution('dailyForecasts', 'success', result);
        logger.info('Scheduled daily forecast generation completed');
      } catch (error) {
        monitor.recordJobExecution('dailyForecasts', 'failed', null, error);
        logger.error(`Scheduled daily forecast generation failed: ${error.message}`);
      }
    });

    this.jobs.push({ name: 'dailyForecasts', job });
    logger.info('Scheduled daily forecast generation: Daily at 3:00 AM');
  }

  /**
   * Generate forecasts for all regions with sufficient data
   */
  async generateAllForecasts(options = {}) {
    const {
      disease = null,
      forecastDays = 14,
      minDataDays = 7,
    } = options;

    try {
      logger.info(`Generating forecasts for all regions${disease ? ` (${disease})` : ''}`);

      // Build query for regions with sufficient data
      const matchStage = {};
      if (disease) {
        matchStage.disease = disease;
      }

      // Get all unique region/disease combinations with at least minDataDays of data
      const regions = await Case.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              region: '$region',
              district: '$district',
              state: '$state',
              disease: '$disease',
            },
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gte: minDataDays },
          },
        },
      ]);

      if (regions.length === 0) {
        logger.warn(`No regions found with at least ${minDataDays} days of data${disease ? ` for ${disease}` : ''}`);
        return {
          success: true,
          message: `No regions found with sufficient data${disease ? ` for ${disease}` : ''}`,
          total: 0,
          successful: 0,
          failed: 0,
          results: [],
        };
      }

      logger.info(`Found ${regions.length} region/disease combinations to forecast`);

      const results = [];
      let successCount = 0;
      let failCount = 0;

      // Generate forecasts for each region/disease combination
      for (const regionData of regions) {
        const { region, district, state, disease: regionDisease } = regionData._id;
        
        try {
          logger.info(`Generating forecast for ${region}/${district}, ${regionDisease}`);
          
          const result = await forecastingService.generateAndSaveForecast(
            region,
            district,
            state,
            regionDisease,
            forecastDays
          );

          results.push({
            success: true,
            region,
            district,
            state,
            disease: regionDisease,
            savedCount: result.savedCount,
          });

          successCount++;
        } catch (error) {
          logger.error(`Failed to generate forecast for ${region}/${district}, ${regionDisease}: ${error.message}`);
          
          results.push({
            success: false,
            region,
            district,
            state,
            disease: regionDisease,
            error: error.message,
          });

          failCount++;
        }
      }

      logger.info(`Forecast generation complete: ${successCount} successful, ${failCount} failed`);

      return {
        success: true,
        message: `Generated forecasts for ${successCount} regions, ${failCount} failed`,
        total: regions.length,
        successful: successCount,
        failed: failCount,
        results,
      };
    } catch (error) {
      logger.error(`Error generating all forecasts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start all scheduled forecast jobs
   */
  start() {
    if (process.env.ENABLE_FORECAST_SCHEDULER !== 'false') {
      this.scheduleDailyForecasts();
      logger.info('Forecast scheduler started');
    } else {
      logger.info('Forecast scheduler disabled via ENABLE_FORECAST_SCHEDULER=false');
    }
  }

  /**
   * Stop all scheduled forecast jobs
   */
  stop() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Stopped forecast job: ${name}`);
    });
    this.jobs = [];
  }
}

module.exports = new ForecastScheduler();

