# Quick Start: Phase 1 & Phase 2 Features

## 🎉 What's New

Phase 1 and Phase 2 are now complete! Your system now has:

✅ **ETL Monitoring** - Track data quality and freshness  
✅ **Automated Forecasts** - Daily forecast generation  
✅ **Data Health Checks** - Automatic issue detection  
✅ **Job History** - Track all ETL executions  

## 🚀 Quick Test

### 1. Restart Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
ETL scheduler started
Forecast scheduler started
```

### 2. Check ETL Status

```bash
curl http://localhost:4000/api/etl/status
```

### 3. Check Data Health

```bash
curl http://localhost:4000/api/etl/health
```

### 4. Check Data Freshness

```bash
curl http://localhost:4000/api/etl/freshness
```

### 5. Check Data Quality

```bash
curl http://localhost:4000/api/etl/quality
```

### 6. View Job History

```bash
curl http://localhost:4000/api/etl/history?limit=10
```

### 7. Manually Trigger Forecast Generation

```bash
curl -X POST http://localhost:4000/api/forecast/generate-all \
  -H "Content-Type: application/json" \
  -d '{"disease": "Dengue", "forecastDays": 14}'
```

## 📊 Automated Schedule

Your system now runs automatically:

- **2:00 AM** - Disease data ingestion
- **3:00 AM** - Forecast generation (uses latest data)
- **Every 6 hours** - Weather data updates

## 🔍 Monitoring Endpoints

All new endpoints are under `/api/etl/`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/etl/status` | ETL status + job statistics |
| `GET /api/etl/freshness` | Data freshness metrics |
| `GET /api/etl/quality` | Data quality metrics |
| `GET /api/etl/health` | Overall health check |
| `GET /api/etl/history` | Job execution history |

## ⚙️ Configuration

Add to your `.env` file:

```bash
# Forecast Scheduler (enabled by default)
ENABLE_FORECAST_SCHEDULER=true
```

## 📝 Next Actions

1. **Backfill Historical Weather** (if not done):
   ```bash
   npm run backfill-weather -- --days 90
   ```

2. **Monitor the System**:
   - Check `/api/etl/health` regularly
   - Review job history
   - Monitor data freshness

3. **Verify Automated Forecasts**:
   - Check logs after 3 AM
   - Verify predictions in database
   - Test forecast endpoints

## 🎯 What to Expect

After restarting your server:

1. **ETL Scheduler** starts automatically
2. **Forecast Scheduler** starts automatically
3. Jobs run on schedule (2 AM, 3 AM, every 6 hours)
4. All executions are tracked and monitored
5. Health checks available via API

## ✨ Summary

**Phase 1 & 2 Complete:**
- ✅ Monitoring system
- ✅ Automated forecasts
- ✅ Data quality tracking
- ✅ Health checks
- ✅ Job history

**System Status:** Production-ready with full automation! 🚀

