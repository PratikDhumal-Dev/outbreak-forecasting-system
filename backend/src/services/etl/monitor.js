const Case = require('../../models/Case');
const Prediction = require('../../models/Prediction');
const logger = require('../../utils/logger');

/**
 * ETL Monitoring Service
 * Tracks data quality, freshness, and ETL job status
 */
class ETLMonitor {
  constructor() {
    this.jobHistory = []; // In-memory job history (could be moved to DB)
  }

  /**
   * Record ETL job execution
   */
  recordJobExecution(jobName, status, result, error = null) {
    const record = {
      jobName,
      status,
      timestamp: new Date(),
      result,
      error: error ? error.message : null,
    };

    this.jobHistory.push(record);
    
    // Keep only last 100 records
    if (this.jobHistory.length > 100) {
      this.jobHistory.shift();
    }

    logger.info(`ETL Job Recorded: ${jobName} - ${status}`);
  }

  /**
   * Get data freshness metrics
   */
  async getDataFreshness() {
    try {
      const now = new Date();
      const metrics = {
        cases: {},
        weather: {},
        predictions: {},
      };

      // Get latest case data
      const latestCase = await Case.findOne().sort({ date: -1 });
      if (latestCase) {
        const ageHours = (now - latestCase.date) / (1000 * 60 * 60);
        metrics.cases = {
          latestDate: latestCase.date,
          ageHours: Math.round(ageHours * 100) / 100,
          freshness: ageHours < 24 ? 'fresh' : ageHours < 48 ? 'stale' : 'outdated',
        };
      }

      // Get cases with weather data
      const latestWeatherCase = await Case.findOne({
        temperature: { $ne: null },
        humidity: { $ne: null },
      }).sort({ date: -1 });

      if (latestWeatherCase) {
        const ageHours = (now - latestWeatherCase.date) / (1000 * 60 * 60);
        metrics.weather = {
          latestDate: latestWeatherCase.date,
          ageHours: Math.round(ageHours * 100) / 100,
          freshness: ageHours < 6 ? 'fresh' : ageHours < 12 ? 'stale' : 'outdated',
        };
      }

      // Get latest prediction
      const latestPrediction = await Prediction.findOne().sort({ forecastDate: -1 });
      if (latestPrediction) {
        const ageHours = (now - latestPrediction.forecastDate) / (1000 * 60 * 60);
        metrics.predictions = {
          latestDate: latestPrediction.forecastDate,
          ageHours: Math.round(ageHours * 100) / 100,
          freshness: ageHours < 24 ? 'fresh' : ageHours < 48 ? 'stale' : 'outdated',
        };
      }

      return metrics;
    } catch (error) {
      logger.error(`Error getting data freshness: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get data quality metrics
   */
  async getDataQuality() {
    try {
      const metrics = {
        totalCases: 0,
        casesWithWeather: 0,
        casesWithoutWeather: 0,
        casesByDisease: {},
        casesByRegion: {},
        missingData: {
          temperature: 0,
          humidity: 0,
          rainfall: 0,
        },
        dateRange: {
          earliest: null,
          latest: null,
          daysCovered: 0,
        },
      };

      // Total cases
      metrics.totalCases = await Case.countDocuments();

      // Cases with/without weather
      metrics.casesWithWeather = await Case.countDocuments({
        temperature: { $ne: null },
        humidity: { $ne: null },
      });
      metrics.casesWithoutWeather = metrics.totalCases - metrics.casesWithWeather;

      // Missing data counts
      metrics.missingData.temperature = await Case.countDocuments({
        temperature: null,
      });
      metrics.missingData.humidity = await Case.countDocuments({
        humidity: null,
      });
      metrics.missingData.rainfall = await Case.countDocuments({
        rainfall: null,
      });

      // Cases by disease
      const diseaseStats = await Case.aggregate([
        {
          $group: {
            _id: '$disease',
            count: { $sum: 1 },
          },
        },
      ]);
      diseaseStats.forEach((stat) => {
        metrics.casesByDisease[stat._id] = stat.count;
      });

      // Cases by region
      const regionStats = await Case.aggregate([
        {
          $group: {
            _id: '$region',
            count: { $sum: 1 },
          },
        },
      ]);
      regionStats.forEach((stat) => {
        metrics.casesByRegion[stat._id] = stat.count;
      });

      // Date range
      const dateRange = await Case.aggregate([
        {
          $group: {
            _id: null,
            earliest: { $min: '$date' },
            latest: { $max: '$date' },
          },
        },
      ]);

      if (dateRange.length > 0) {
        metrics.dateRange.earliest = dateRange[0].earliest;
        metrics.dateRange.latest = dateRange[0].latest;
        const daysDiff = (dateRange[0].latest - dateRange[0].earliest) / (1000 * 60 * 60 * 24);
        metrics.dateRange.daysCovered = Math.round(daysDiff);
      }

      return metrics;
    } catch (error) {
      logger.error(`Error getting data quality: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ETL job history
   */
  getJobHistory(limit = 50) {
    return this.jobHistory.slice(-limit).reverse();
  }

  /**
   * Get ETL job statistics
   */
  getJobStatistics() {
    const stats = {
      totalJobs: this.jobHistory.length,
      successful: 0,
      failed: 0,
      byJobType: {},
      lastExecution: {},
    };

    this.jobHistory.forEach((job) => {
      if (job.status === 'success') {
        stats.successful++;
      } else {
        stats.failed++;
      }

      if (!stats.byJobType[job.jobName]) {
        stats.byJobType[job.jobName] = {
          total: 0,
          successful: 0,
          failed: 0,
        };
      }

      stats.byJobType[job.jobName].total++;
      if (job.status === 'success') {
        stats.byJobType[job.jobName].successful++;
      } else {
        stats.byJobType[job.jobName].failed++;
      }

      // Track last execution
      if (!stats.lastExecution[job.jobName] || 
          job.timestamp > stats.lastExecution[job.jobName]) {
        stats.lastExecution[job.jobName] = job.timestamp;
      }
    });

    return stats;
  }

  /**
   * Check if data needs attention
   */
  async checkDataHealth() {
    try {
      const freshness = await this.getDataFreshness();
      const quality = await this.getDataQuality();
      const issues = [];

      // Check data freshness
      if (freshness.cases.freshness === 'outdated') {
        issues.push({
          type: 'freshness',
          severity: 'high',
          message: `Case data is outdated (${freshness.cases.ageHours} hours old)`,
        });
      }

      if (freshness.weather.freshness === 'outdated') {
        issues.push({
          type: 'freshness',
          severity: 'medium',
          message: `Weather data is outdated (${freshness.weather.ageHours} hours old)`,
        });
      }

      // Check data quality
      const weatherCoverage = (quality.casesWithWeather / quality.totalCases) * 100;
      if (weatherCoverage < 50) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          message: `Only ${weatherCoverage.toFixed(1)}% of cases have weather data`,
        });
      }

      if (quality.totalCases < 100) {
        issues.push({
          type: 'quality',
          severity: 'low',
          message: `Low data volume: only ${quality.totalCases} cases in database`,
        });
      }

      return {
        healthy: issues.length === 0,
        issues,
        freshness,
        quality,
      };
    } catch (error) {
      logger.error(`Error checking data health: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ETLMonitor();

