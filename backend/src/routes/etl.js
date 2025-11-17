const express = require('express');

const router = express.Router();
const logger = require('../utils/logger');
const ETLScheduler = require('../services/etl/scheduler');
const IndianHealthDataETL = require('../services/etl/indianHealthData');
const monitor = require('../services/etl/monitor');

const scheduler = new ETLScheduler();

// Trigger disease data ingestion manually
router.post('/disease-data', async (req, res) => {
  try {
    logger.info('Manual disease data ingestion triggered via API');
    const result = await scheduler.triggerDiseaseDataIngestion();

    res.json({
      success: true,
      message: 'Disease data ingestion completed',
      data: result,
    });
  } catch (error) {
    logger.error(`Manual disease data ingestion failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest disease data',
      message: error.message,
    });
  }
});

// Trigger weather data ingestion manually
router.post('/weather-data', async (req, res) => {
  try {
    const regions = req.body?.regions || [];
    logger.info('Manual weather data ingestion triggered via API');

    const result = await scheduler.triggerWeatherDataIngestion(regions);

    res.json({
      success: true,
      message: 'Weather data ingestion completed',
      data: result,
    });
  } catch (error) {
    logger.error(`Manual weather data ingestion failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest weather data',
      message: error.message,
    });
  }
});

// Trigger Indian health data ingestion manually
router.post('/indian-health-data', async (req, res) => {
  try {
    logger.info('Manual Indian health data ingestion triggered via API');
    const indianHealthETL = new IndianHealthDataETL();
    const result = await indianHealthETL.execute();

    res.json({
      success: true,
      message: 'Indian health data ingestion completed',
      data: result,
    });
  } catch (error) {
    logger.error(`Manual Indian health data ingestion failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to ingest Indian health data',
      message: error.message,
    });
  }
});

// Get ETL job status
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        schedulerEnabled: process.env.ENABLE_ETL_SCHEDULER !== 'false',
        jobs: scheduler.jobs.map((j) => j.name),
        indianHealthETLEnabled: process.env.ENABLE_INDIAN_HEALTH_ETL === 'true',
        jobStatistics: monitor.getJobStatistics(),
      },
    });
  } catch (error) {
    logger.error(`Failed to get ETL status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get ETL status',
      message: error.message,
    });
  }
});

// Get data freshness metrics
router.get('/freshness', async (req, res) => {
  try {
    const freshness = await monitor.getDataFreshness();
    res.json({
      success: true,
      data: freshness,
    });
  } catch (error) {
    logger.error(`Failed to get data freshness: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get data freshness',
      message: error.message,
    });
  }
});

// Get data quality metrics
router.get('/quality', async (req, res) => {
  try {
    const quality = await monitor.getDataQuality();
    res.json({
      success: true,
      data: quality,
    });
  } catch (error) {
    logger.error(`Failed to get data quality: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get data quality',
      message: error.message,
    });
  }
});

// Get data health check
router.get('/health', async (req, res) => {
  try {
    const health = await monitor.checkDataHealth();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error(`Failed to check data health: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to check data health',
      message: error.message,
    });
  }
});

// Get ETL job history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = monitor.getJobHistory(limit);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error(`Failed to get job history: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get job history',
      message: error.message,
    });
  }
});

module.exports = router;
