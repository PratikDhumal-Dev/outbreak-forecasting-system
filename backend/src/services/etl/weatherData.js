const axios = require('axios');
const BaseETLService = require('./base');
const Case = require('../../models/Case');
const logger = require('../../utils/logger');

// Indian city coordinates mapping
const INDIAN_CITIES = {
  Pune: { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  Mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
  Delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
  Bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
  Chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  Nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
  Hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
  Kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
};

/**
 * ETL service for weather/climate data
 * Supports both OpenMeteo (free, no API key) and OpenWeatherMap
 */
class WeatherDataETL extends BaseETLService {
  constructor() {
    super('WeatherDataETL');
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.apiUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
    this.useOpenMeteo = process.env.USE_OPENMETEO !== 'false'; // Default to OpenMeteo
    this.openMeteoUrl = 'https://api.open-meteo.com/v1/forecast';
  }

  /**
   * Get coordinates for a region
   */
  getRegionCoordinates(regionName) {
    // Try to find in mapping
    const city = INDIAN_CITIES[regionName];
    if (city) {
      return { lat: city.lat, lon: city.lon };
    }
    
    // Try to extract from region object
    if (typeof regionName === 'object') {
      const name = regionName.name || regionName.region || regionName;
      const cityObj = INDIAN_CITIES[name];
      if (cityObj) {
        return { lat: cityObj.lat, lon: cityObj.lon };
      }
    }
    
    return null;
  }

  /**
   * Fetch weather from OpenMeteo (free, no API key required)
   */
  async fetchOpenMeteoWeather(regionName, date = null) {
    try {
      const coords = this.getRegionCoordinates(regionName);
      if (!coords) {
        throw new Error(`Coordinates not found for region: ${regionName}`);
      }

      const params = {
        latitude: coords.lat,
        longitude: coords.lon,
        current: 'temperature_2m,relative_humidity_2m,precipitation',
        timezone: 'Asia/Kolkata',
      };

      // For historical data
      if (date) {
        params.start_date = date;
        params.end_date = date;
      }

      const response = await axios.get(this.openMeteoUrl, {
        params,
        timeout: 10000,
      });

      return {
        region: typeof regionName === 'object' ? (regionName.name || regionName.region || regionName) : regionName,
        data: response.data,
        source: 'openmeteo',
      };
    } catch (error) {
      this.logger.warn(`OpenMeteo fetch failed for ${regionName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch weather from OpenWeatherMap
   */
  async fetchOpenWeatherMap(regionName) {
    try {
      if (!this.apiKey || this.apiKey === 'your_openweather_api_key_here') {
        throw new Error('OpenWeatherMap API key not configured');
      }

      const coords = this.getRegionCoordinates(regionName);
      const query = coords 
        ? `${coords.lat},${coords.lon}` 
        : (typeof regionName === 'object' ? (regionName.city || regionName.name || regionName) : regionName);

      const response = await axios.get(`${this.apiUrl}/weather`, {
        params: coords
          ? { lat: coords.lat, lon: coords.lon, appid: this.apiKey, units: 'metric' }
          : { q: query, appid: this.apiKey, units: 'metric' },
        timeout: 5000,
      });

      return {
        region: typeof regionName === 'object' ? (regionName.name || regionName.region || regionName) : regionName,
        data: response.data,
        source: 'openweathermap',
      };
    } catch (error) {
      this.logger.warn(`OpenWeatherMap fetch failed for ${regionName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract weather data for a list of regions
   */
  async extract(regions = []) {
    try {
      this.logger.info(`Fetching weather data for ${regions.length} regions using ${this.useOpenMeteo ? 'OpenMeteo' : 'OpenWeatherMap'}`);

      const weatherData = [];

      // Fetch weather for each region
      for (const region of regions) {
        try {
          let result;
          
          if (this.useOpenMeteo) {
            result = await this.fetchOpenMeteoWeather(region);
          } else {
            result = await this.fetchOpenWeatherMap(region);
          }

          weatherData.push(result);
        } catch (error) {
          // Try fallback if primary method fails
          if (this.useOpenMeteo && this.apiKey && this.apiKey !== 'your_openweather_api_key_here') {
            this.logger.info(`Trying OpenWeatherMap fallback for ${region}`);
            try {
              const result = await this.fetchOpenWeatherMap(region);
              weatherData.push(result);
            } catch (fallbackError) {
              this.logger.warn(`Both weather APIs failed for ${region}: ${fallbackError.message}`);
            }
          } else {
            this.logger.warn(`Failed to fetch weather for ${region}: ${error.message}`);
          }
        }
      }

      return weatherData;
    } catch (error) {
      this.logger.error(`Failed to extract weather data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Transform weather API response to our format
   */
  async transform(rawData) {
    try {
      this.logger.info('Transforming weather data');
      const transformed = [];

      for (const item of rawData) {
        const weather = item.data;
        let transformedRecord;

        if (item.source === 'openmeteo') {
          // OpenMeteo format
          const current = weather.current || {};
          transformedRecord = {
            region: item.region,
            temperature: current.temperature_2m || null,
            humidity: current.relative_humidity_2m || null,
            rainfall: current.precipitation || null,
            date: new Date(),
            source: 'openmeteo',
            metadata: {
              time: current.time || new Date().toISOString(),
              units: {
                temperature: '°C',
                humidity: '%',
                precipitation: 'mm',
              },
            },
          };
        } else {
          // OpenWeatherMap format
          transformedRecord = {
            region: item.region,
            temperature: weather.main?.temp || null,
            humidity: weather.main?.humidity || null,
            rainfall: weather.rain?.['1h'] || weather.rain?.['3h'] || null,
            date: new Date(),
            source: 'openweathermap',
            metadata: {
              description: weather.weather?.[0]?.description || null,
              windSpeed: weather.wind?.speed || null,
              visibility: weather.visibility || null,
              pressure: weather.main?.pressure || null,
            },
          };
        }

        transformed.push(transformedRecord);
      }

      this.logger.info(`Transformed ${transformed.length} weather records`);
      return transformed;
    } catch (error) {
      this.logger.error(`Failed to transform weather data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update Case records with weather data
   */
  async load(transformedData) {
    try {
      this.validate(transformedData);
      this.logger.info(`Updating ${transformedData.length} case records with weather data`);

      const results = {
        updated: 0,
        errors: [],
      };

      for (const record of transformedData) {
        try {
          // Update recent case records for this region with weather data
          const updateResult = await Case.updateMany(
            {
              region: record.region,
              date: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
            {
              $set: {
                temperature: record.temperature,
                humidity: record.humidity,
                rainfall: record.rainfall || undefined,
                metadata: {
                  ...record.metadata,
                  weatherUpdated: new Date(),
                  weatherSource: record.source,
                },
              },
            }
          );

          results.updated += updateResult.modifiedCount;
        } catch (error) {
          results.errors.push({
            region: record.region,
            error: error.message,
          });
          this.logger.warn(`Failed to update weather for ${record.region}: ${error.message}`);
        }
      }

      this.logger.info(`Weather update complete: ${results.updated} records updated, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      this.logger.error(`Failed to load weather data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = WeatherDataETL;
