require('dotenv').config({ path: require('path').join(__dirname, '../..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../db/connection');
const Case = require('../models/Case');
const WeatherDataETL = require('../services/etl/weatherData');
const logger = require('../utils/logger');
const axios = require('axios');

// Indian city coordinates
const INDIAN_CITIES = {
  Pune: { lat: 18.5204, lon: 73.8567 },
  Mumbai: { lat: 19.0760, lon: 72.8777 },
  Delhi: { lat: 28.6139, lon: 77.2090 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Nagpur: { lat: 21.1458, lon: 79.0882 },
  Hyderabad: { lat: 17.3850, lon: 78.4867 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
};

/**
 * Fetch historical weather data from OpenMeteo
 */
async function fetchHistoricalWeather(region, date) {
  try {
    const city = INDIAN_CITIES[region];
    if (!city) {
      throw new Error(`Coordinates not found for region: ${region}`);
    }

    const dateStr = date.toISOString().split('T')[0];
    
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: city.lat,
        longitude: city.lon,
        start_date: dateStr,
        end_date: dateStr,
        daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum',
        timezone: 'Asia/Kolkata',
      },
      timeout: 10000,
    });

    if (response.data && response.data.daily) {
      const daily = response.data.daily;
      return {
        temperature: (daily.temperature_2m_max[0] + daily.temperature_2m_min[0]) / 2,
        humidity: daily.relative_humidity_2m_mean[0] || null,
        rainfall: daily.precipitation_sum[0] || 0,
        date: date,
      };
    }

    return null;
  } catch (error) {
    logger.warn(`Failed to fetch historical weather for ${region} on ${date}: ${error.message}`);
    return null;
  }
}

/**
 * Backfill weather data for existing case records
 */
async function backfillWeatherData(options = {}) {
  const {
    days = 90,
    regions = null,
    batchSize = 10,
    delayMs = 1000, // Delay between API calls to avoid rate limiting
  } = options;

  try {
    await connectDB();
    logger.info('Starting weather data backfill...');

    // Get distinct regions from cases
    let targetRegions = regions;
    if (!targetRegions) {
      targetRegions = await Case.distinct('region');
      logger.info(`Found ${targetRegions.length} regions: ${targetRegions.join(', ')}`);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    logger.info(`Backfilling weather data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    let totalUpdated = 0;
    let totalErrors = 0;

    // Process each region
    for (const region of targetRegions) {
      if (!INDIAN_CITIES[region]) {
        logger.warn(`Skipping ${region} - coordinates not available`);
        continue;
      }

      logger.info(`Processing region: ${region}`);

      // Get cases for this region that need weather data
      const cases = await Case.find({
        region: region,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        $or: [
          { temperature: null },
          { humidity: null },
          { rainfall: null },
        ],
      }).sort({ date: 1 });

      logger.info(`Found ${cases.length} cases needing weather data for ${region}`);

      // Process in batches
      for (let i = 0; i < cases.length; i += batchSize) {
        const batch = cases.slice(i, i + batchSize);
        
        for (const caseRecord of batch) {
          try {
            const weatherData = await fetchHistoricalWeather(region, caseRecord.date);
            
            if (weatherData) {
              await Case.findByIdAndUpdate(caseRecord._id, {
                $set: {
                  temperature: weatherData.temperature,
                  humidity: weatherData.humidity,
                  rainfall: weatherData.rainfall,
                  metadata: {
                    ...caseRecord.metadata,
                    weatherBackfilled: new Date(),
                    weatherSource: 'openmeteo-historical',
                  },
                },
              });

              totalUpdated++;
              
              if (totalUpdated % 10 === 0) {
                logger.info(`Updated ${totalUpdated} records so far...`);
              }
            }

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } catch (error) {
            logger.error(`Error updating case ${caseRecord._id}: ${error.message}`);
            totalErrors++;
          }
        }
      }
    }

    logger.info(`✅ Weather backfill completed!`);
    logger.info(`   Updated: ${totalUpdated} records`);
    logger.info(`   Errors: ${totalErrors}`);
    
    return {
      success: true,
      updated: totalUpdated,
      errors: totalErrors,
    };
  } catch (error) {
    logger.error(`❌ Weather backfill failed: ${error.message}`, error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      options.days = parseInt(args[i + 1], 10);
    } else if (args[i] === '--regions' && args[i + 1]) {
      options.regions = args[i + 1].split(',');
    } else if (args[i] === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
    } else if (args[i] === '--delay' && args[i + 1]) {
      options.delayMs = parseInt(args[i + 1], 10);
    }
  }

  backfillWeatherData(options)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Backfill failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = backfillWeatherData;

