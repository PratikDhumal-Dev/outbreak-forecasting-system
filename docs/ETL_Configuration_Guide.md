# ETL Configuration Guide

## Overview

This guide explains how to configure and use the Enhanced ETL (Extract, Transform, Load) services for MedSentinel, including weather data, disease data, and Indian health data sources.

## Weather API Configuration

### Option 1: OpenMeteo (Recommended - Free, No API Key)

OpenMeteo is now the default weather data source. It's free, requires no API key, and provides historical data.

**Configuration:**
```bash
USE_OPENMETEO=true  # Default, no need to set
```

**Features:**
- ✅ Free, no API key required
- ✅ Historical weather data support
- ✅ Indian city coordinates pre-configured
- ✅ Automatic fallback to OpenWeatherMap if configured

### Option 2: OpenWeatherMap (Optional - Requires API Key)

If you prefer OpenWeatherMap or want a fallback:

1. **Get API Key:**
   - Sign up at https://home.openweathermap.org/users/sign_up
   - Get your API key from the dashboard

2. **Configure:**
   ```bash
   USE_OPENMETEO=false
   OPENWEATHER_API_KEY=your_actual_api_key_here
   WEATHER_API_URL=https://api.openweathermap.org/data/2.5
   ```

**Note:** OpenMeteo will automatically fallback to OpenWeatherMap if OpenMeteo fails and an API key is configured.

## Disease Data ETL Configuration

### COVID-19 Data (disease.sh)

**Default Configuration:**
```bash
DISEASE_API_URL=https://disease.sh/v3/covid-19
DISEASE_TYPE=COVID-19
TARGET_REGIONS=Pune,Mumbai,Delhi,Bangalore,Chennai,Nagpur,Hyderabad,Kolkata
```

**How it works:**
- Fetches India-level COVID-19 data
- Distributes data across configured Indian regions
- Maps to district/state structure

**Manual Trigger:**
```bash
curl -X POST http://localhost:4000/api/etl/disease-data
```

### Other Diseases

For diseases other than COVID-19 (Dengue, Malaria, Cholera, Flu), the ETL currently uses placeholder methods. Real data sources need to be integrated.

## Indian Health Data ETL

### Configuration

**Enable the service:**
```bash
ENABLE_INDIAN_HEALTH_ETL=true
NEWS_API_KEY=your_news_api_key_here  # Optional, for news-based outbreak detection
```

**Data Sources (when available):**
- IDSP (Integrated Disease Surveillance Programme)
- State health department APIs
- MoHFW (Ministry of Health and Family Welfare) reports
- News API for outbreak mentions

**Manual Trigger:**
```bash
curl -X POST http://localhost:4000/api/etl/indian-health-data
```

**Note:** Most Indian health data sources don't provide public APIs. This service provides a framework for integration when data sources become available.

## Historical Weather Data Backfill

### Usage

Backfill historical weather data for existing case records:

```bash
# Backfill last 90 days (default)
npm run backfill-weather

# Backfill specific number of days
npm run backfill-weather -- --days 180

# Backfill specific regions
npm run backfill-weather -- --regions Pune,Mumbai,Delhi

# Custom batch size and delay
npm run backfill-weather -- --batch-size 5 --delay 2000
```

### Options

- `--days <number>`: Number of days to backfill (default: 90)
- `--regions <comma-separated>`: Specific regions to backfill
- `--batch-size <number>`: Number of records to process at once (default: 10)
- `--delay <ms>`: Delay between API calls in milliseconds (default: 1000)

### Example

```bash
# Backfill last 30 days for Pune and Mumbai only
npm run backfill-weather -- --days 30 --regions Pune,Mumbai
```

## ETL Scheduler

### Automatic Scheduling

The ETL scheduler runs automatically when the backend starts (if enabled):

```bash
ENABLE_ETL_SCHEDULER=true
```

**Scheduled Jobs:**
- **Disease Data:** Daily at 2:00 AM
- **Weather Data:** Every 6 hours

### Manual Triggers

**Disease Data:**
```bash
curl -X POST http://localhost:4000/api/etl/disease-data
```

**Weather Data:**
```bash
curl -X POST http://localhost:4000/api/etl/weather-data
# Or with specific regions:
curl -X POST http://localhost:4000/api/etl/weather-data \
  -H "Content-Type: application/json" \
  -d '{"regions": [{"name": "Pune"}, {"name": "Mumbai"}]}'
```

**Indian Health Data:**
```bash
curl -X POST http://localhost:4000/api/etl/indian-health-data
```

**Check Status:**
```bash
curl http://localhost:4000/api/etl/status
```

## Environment Variables Summary

```bash
# ETL Scheduler
ENABLE_ETL_SCHEDULER=true

# Disease Data
DISEASE_API_URL=https://disease.sh/v3/covid-19
DISEASE_TYPE=COVID-19
TARGET_REGIONS=Pune,Mumbai,Delhi,Bangalore,Chennai,Nagpur,Hyderabad,Kolkata

# Weather API
USE_OPENMETEO=true  # Default, free, no API key needed
OPENWEATHER_API_KEY=your_openweather_api_key_here  # Optional fallback
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Indian Health Data
ENABLE_INDIAN_HEALTH_ETL=false
NEWS_API_KEY=your_news_api_key_here  # Optional
```

## Supported Indian Cities

The following cities are pre-configured with coordinates:

- Pune (Maharashtra)
- Mumbai (Maharashtra)
- Delhi (Delhi)
- Bangalore (Karnataka)
- Chennai (Tamil Nadu)
- Nagpur (Maharashtra)
- Hyderabad (Telangana)
- Kolkata (West Bengal)

## Troubleshooting

### Weather API Issues

**Problem:** Weather data not being fetched

**Solutions:**
1. Check if OpenMeteo is working: `USE_OPENMETEO=true` (default)
2. If using OpenWeatherMap, verify API key is correct
3. Check network connectivity
4. Verify city names match the pre-configured list

### Disease Data Issues

**Problem:** No disease data being ingested

**Solutions:**
1. Check `DISEASE_API_URL` is correct
2. Verify network connectivity to disease.sh
3. Check logs for API errors
4. Ensure `TARGET_REGIONS` includes valid region names

### Backfill Issues

**Problem:** Backfill script fails or is slow

**Solutions:**
1. Reduce batch size: `--batch-size 5`
2. Increase delay: `--delay 2000`
3. Backfill fewer days: `--days 30`
4. Check OpenMeteo API rate limits

## Next Steps

1. **Configure Weather API:** Use OpenMeteo (default) or set up OpenWeatherMap
2. **Run Backfill:** Backfill historical weather data for existing cases
3. **Test ETL:** Manually trigger ETL jobs to verify configuration
4. **Monitor:** Check ETL status endpoint regularly
5. **Integrate Real Sources:** When Indian health APIs become available, integrate them

## API Documentation

All ETL endpoints are available at:
- Base URL: `http://localhost:4000/api/etl`
- Health Check: `GET /api/etl/status`
- Manual Triggers: `POST /api/etl/{service-name}`

