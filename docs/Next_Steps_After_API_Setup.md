# Next Steps After API Key Setup

## ✅ What You've Done

You've successfully configured:
- ✅ OpenWeatherMap API key (fallback weather source)
- ✅ News API key (for outbreak detection)
- ✅ OpenMeteo enabled (free, default weather source)

## 🚀 Immediate Next Steps

### 1. Test Weather Data Ingestion

Test that weather APIs are working:

```bash
# Start your backend server (if not running)
cd backend
npm run dev

# In another terminal, trigger weather data ingestion
curl -X POST http://localhost:4000/api/etl/weather-data
```

**Expected Result:**
- Weather data fetched for all configured regions
- Case records updated with temperature, humidity, rainfall
- Check logs for success messages

### 2. Backfill Historical Weather Data

Backfill weather data for existing case records:

```bash
# Backfill last 90 days (recommended)
npm run backfill-weather

# Or backfill specific days
npm run backfill-weather -- --days 180

# Or backfill specific regions
npm run backfill-weather -- --regions Pune,Mumbai,Delhi
```

**What this does:**
- Fetches historical weather for all case records
- Updates temperature, humidity, rainfall fields
- Uses OpenMeteo (free, no rate limits for reasonable use)

### 3. Test Disease Data ETL

Verify disease data ingestion is working:

```bash
curl -X POST http://localhost:4000/api/etl/disease-data
```

**Expected Result:**
- COVID-19 data fetched from disease.sh
- Data distributed across Indian regions
- New case records created/updated

### 4. (Optional) Test Indian Health Data ETL

If you want to test news-based outbreak detection:

```bash
# First, enable it in .env
# ENABLE_INDIAN_HEALTH_ETL=true

# Then restart backend and test
curl -X POST http://localhost:4000/api/etl/indian-health-data
```

**Note:** This is optional and uses your News API quota (100 requests/day on free tier).

## 📊 Verify Everything Works

### Check ETL Status

```bash
curl http://localhost:4000/api/etl/status
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "schedulerEnabled": true,
    "jobs": ["diseaseData", "weatherData"],
    "indianHealthETLEnabled": false
  }
}
```

### Check Database

Verify data is being stored:

```bash
# Check cases with weather data
curl "http://localhost:4000/api/cases?limit=5"

# Check available regions for forecasting
curl "http://localhost:4000/api/forecast/available-regions"
```

## 🔄 Automated Scheduling

Your ETL scheduler is already configured to run automatically:

- **Disease Data:** Daily at 2:00 AM
- **Weather Data:** Every 6 hours

No action needed - it runs automatically when the backend is running!

## 🎯 Recommended Workflow

### For Development/Testing:

1. **Seed the database** (if not done):
   ```bash
   npm run seed
   ```

2. **Backfill weather data**:
   ```bash
   npm run backfill-weather -- --days 90
   ```

3. **Test forecasting**:
   ```bash
   curl -X POST http://localhost:4000/api/forecast/generate \
     -H "Content-Type: application/json" \
     -d '{
       "region": "Pune",
       "district": "Pune",
       "state": "Maharashtra",
       "disease": "Dengue",
       "forecastDays": 14
     }'
   ```

### For Production:

1. ✅ APIs are configured
2. ✅ ETL scheduler is enabled
3. ✅ Backfill historical weather data
4. Monitor logs for ETL job success
5. Verify forecasts are being generated

## 🐛 Troubleshooting

### Weather API Not Working

**Check:**
- Is OpenMeteo working? (default, should work)
- Is OpenWeatherMap key valid? (fallback)
- Check backend logs for errors

**Test:**
```bash
# Test OpenMeteo directly
curl "https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current=temperature_2m,relative_humidity_2m"

# Test OpenWeatherMap
curl "http://api.openweathermap.org/data/2.5/weather?q=Pune&appid=YOUR_API_KEY&units=metric"
```

### News API Not Working

**Check:**
- Is API key correct?
- Free tier: 100 requests/day limit
- Check if `ENABLE_INDIAN_HEALTH_ETL=true`

**Note:** News API is optional - system works without it!

### No Data Being Ingested

**Check:**
- Is MongoDB running? (`mongodb://localhost:27017/medsentinel`)
- Are there any errors in backend logs?
- Is ETL scheduler enabled? (`ENABLE_ETL_SCHEDULER=true`)

## 📝 Quick Checklist

- [x] OpenWeatherMap API key added
- [x] News API key added
- [ ] Test weather data ingestion
- [ ] Backfill historical weather data
- [ ] Test disease data ETL
- [ ] Verify data in database
- [ ] Test forecasting service
- [ ] (Optional) Test Indian health ETL

## 🎉 You're All Set!

Your system is now configured with:
- ✅ Weather data (OpenMeteo + OpenWeatherMap fallback)
- ✅ Disease data (disease.sh for COVID-19)
- ✅ News-based outbreak detection (optional)
- ✅ Automated ETL scheduling
- ✅ Historical weather backfill capability

**Next:** Start using the system! The ETL will run automatically, and you can generate forecasts.

