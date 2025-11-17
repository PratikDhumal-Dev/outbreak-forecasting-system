# MedSentinel Frontend

React Native Expo application for MedSentinel - Next-Gen Outbreak Forecasting & Response Platform.

## Features

- **Cross-platform**: Runs on Web, Android, and iOS
- **Real-time data**: Fetches live data from MedSentinel backend API
- **Risk visualization**: Map-based view of outbreak risks (placeholder for Mapbox integration)
- **Forecasts**: View AI-powered disease predictions with risk scores
- **Logistics**: Monitor stock levels and recommended actions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
Create a `.env` file or set environment variable:
```
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

3. Start the development server:
```bash
npm start
```

Then choose:
- `w` for web
- `a` for Android
- `i` for iOS

## Project Structure

```
frontend/
├── app/              # Expo Router pages
│   ├── _layout.js    # Root layout with navigation
│   ├── index.js      # Home/Dashboard screen
│   ├── map.js        # Risk map visualization
│   ├── predictions.js # Forecasts screen
│   └── logistics.js  # Logistics dashboard
├── src/
│   └── services/
│       └── api.js    # API client configuration
└── assets/           # Images, fonts, etc.
```

## Next Steps

- [ ] Add Mapbox/MapLibre integration for map visualization
- [ ] Implement authentication flow
- [ ] Add chart libraries for analytics
- [ ] Create detail screens for predictions and logistics
- [ ] Add push notifications for alerts
- [ ] Implement offline data caching

## API Integration

The app connects to the MedSentinel backend API. Ensure the backend is running on the configured port (default: 4000).

Endpoints used:
- `GET /api/health` - System health check
- `GET /api/predictions` - Fetch disease forecasts
- `GET /api/logistics` - Fetch logistics data
