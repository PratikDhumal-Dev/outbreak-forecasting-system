const express = require('express');

const router = express.Router();
const logger = require('../utils/logger');
const forecastingService = require('../services/forecasting');
const Case = require('../models/Case');

// Generate forecast for a specific region
router.post('/generate', async (req, res) => {
  try {
    const { region, district, state, disease, forecastDays = 14 } = req.body;

    if (!region || !district || !state || !disease) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['region', 'district', 'state', 'disease'],
      });
    }

    logger.info(`Generating forecast for ${region}, ${disease}`);

    const result = await forecastingService.generateAndSaveForecast(
      region,
      district,
      state,
      disease,
      forecastDays
    );

    res.json({
      success: true,
      message: 'Forecast generated and saved successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`Forecast generation failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      message: error.message,
    });
  }
});

// Generate forecasts for all regions with sufficient data
// Uses the forecast scheduler for consistent behavior
router.post('/generate-all', async (req, res) => {
  try {
    const { disease, forecastDays = 14 } = req.body;
    const forecastScheduler = require('../services/forecastScheduler');
    
    logger.info(`Generating forecasts for all regions${disease ? ` (${disease})` : ''}`);
    
    const result = await forecastScheduler.generateAllForecasts({
      disease,
      forecastDays,
    });

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    logger.error(`Batch forecast generation failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch forecasts',
      message: error.message,
    });
  }
});

// Check available regions for forecasting
router.get('/available-regions', async (req, res) => {
  try {
    const { disease } = req.query;

    const matchStage = disease ? { disease } : {};

    const regions = await Case.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: {
            region: '$region',
            district: '$district',
            state: '$state',
            disease: '$disease',
          },
          count: { $sum: 1 },
          latestDate: { $max: '$date' },
          earliestDate: { $min: '$date' },
        },
      },
      {
        $match: {
          count: { $gte: 7 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      success: true,
      data: regions.map((r) => ({
        region: r._id.region,
        district: r._id.district,
        state: r._id.state,
        disease: r._id.disease,
        dataPoints: r.count,
        dateRange: {
          from: r.earliestDate,
          to: r.latestDate,
        },
      })),
    });
  } catch (error) {
    logger.error(`Error fetching available regions: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available regions',
      message: error.message,
    });
  }
});

// Check forecasting service health
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await forecastingService.checkHealth();
    res.json({
      service: 'forecasting',
      status: isHealthy ? 'online' : 'offline',
      url: forecastingService.baseUrl,
    });
  } catch (error) {
    logger.error(`Forecast health check failed: ${error.message}`);
    res.status(500).json({
      service: 'forecasting',
      status: 'error',
      error: error.message,
    });
  }
});

module.exports = router;