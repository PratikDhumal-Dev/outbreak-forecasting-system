const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');
const Case = require('../models/Case');
const Prediction = require('../models/Prediction');

/**
 * Service for interacting with the forecasting microservice
 */
class ForecastingService {
  constructor() {
    this.baseUrl = config.forecastingServiceUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds for model training
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if forecasting service is available
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      logger.warn(`Forecasting service health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Fetch historical case data for a region
   */
  async getHistoricalData(region, district, state, disease, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const cases = await Case.find({
        region,
        district,
        state,
        disease,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .sort({ date: 1 })
        .lean();

      return cases.map((caseData) => ({
        date: caseData.date,
        cases: caseData.newCases || 0,
        temperature: caseData.temperature || null,
        humidity: caseData.humidity || null,
        rainfall: caseData.rainfall || null,
      }));
    } catch (error) {
      logger.error(`Error fetching historical data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate forecast for a region
   */
  async generateForecast(region, district, state, disease, forecastDays = 14) {
    try {
      // Check if service is available
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        throw new Error('Forecasting service is not available');
      }

      // Fetch historical data
      const historicalData = await this.getHistoricalData(region, district, state, disease);

      if (historicalData.length < 7) {
        throw new Error(`Insufficient historical data: need at least 7 days, got ${historicalData.length}`);
      }

      // Prepare request for forecasting service
      const forecastRequest = {
        region,
        district,
        state,
        disease,
        historical_data: historicalData,
        forecast_days: forecastDays,
      };

      logger.info(`Requesting forecast for ${region}, ${disease}`);

      // Call forecasting service
      const response = await this.client.post('/forecast', forecastRequest);

      return response.data;
    } catch (error) {
      logger.error(`Error generating forecast: ${error.message}`);
      if (error.response) {
        throw new Error(`Forecasting service error: ${error.response.data.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate and save forecast to database
   */
  async generateAndSaveForecast(region, district, state, disease, forecastDays = 14) {
    try {
      const forecast = await this.generateForecast(region, district, state, disease, forecastDays);

      // Save forecast points to database
      const savedPredictions = [];

      for (const point of forecast.forecast_points) {
        const prediction = new Prediction({
          region: forecast.region,
          district: forecast.district,
          state: forecast.state,
          disease: forecast.disease,
          forecastDate: new Date(point.date),
          predictedCases: Math.round(point.predicted_cases),
          confidence: forecast.confidence,
          confidenceInterval: {
            lower: Math.round(point.lower_bound),
            upper: Math.round(point.upper_bound),
          },
          riskLevel: forecast.risk_level,
          riskScore: forecast.risk_score,
          modelVersion: forecast.model_version,
          features: {
            historicalDays: forecast.forecast_points.length,
          },
        });

        // Use upsert to avoid duplicates
        const saved = await Prediction.findOneAndUpdate(
          {
            region: forecast.region,
            district: forecast.district,
            disease: forecast.disease,
            forecastDate: new Date(point.date),
          },
          prediction.toObject(),
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        savedPredictions.push(saved);
      }

      logger.info(`Saved ${savedPredictions.length} forecast predictions for ${region}, ${disease}`);

      return {
        forecast,
        savedCount: savedPredictions.length,
      };
    } catch (error) {
      logger.error(`Error generating and saving forecast: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate forecasts for multiple regions
   */
  async generateBatchForecasts(regions, disease, forecastDays = 14) {
    const results = [];

    for (const regionData of regions) {
      try {
        const result = await this.generateAndSaveForecast(
          regionData.region,
          regionData.district,
          regionData.state,
          disease,
          forecastDays
        );
        results.push({
          success: true,
          region: regionData.region,
          ...result,
        });
      } catch (error) {
        logger.error(`Failed to generate forecast for ${regionData.region}: ${error.message}`);
        results.push({
          success: false,
          region: regionData.region,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new ForecastingService();
