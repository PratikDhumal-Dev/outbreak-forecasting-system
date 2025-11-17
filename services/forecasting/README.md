# MedSentinel Forecasting Service

## Overview

FastAPI microservice exposing ML forecasting endpoints for MedSentinel. Current scaffold provides a health check and CORS configuration; forecasting endpoints will be added during Phase 2.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- MongoDB (for future data access - optional for initial setup)

## Setup Steps

### 1. Navigate to the forecasting service directory

```bash
cd services/forecasting
```

### 2. Create a Python virtual environment

```bash
python3 -m venv .venv
```

**Note:** On Windows, use:
```bash
python -m venv .venv
```

### 3. Activate the virtual environment

**On macOS/Linux:**
```bash
source .venv/bin/activate
```

**On Windows:**
```bash
.venv\Scripts\activate
```

### 4. Upgrade pip (recommended)

```bash
pip install --upgrade pip
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

**Note:** Installing Prophet may take a few minutes as it requires compiling C++ extensions.

### 6. Configure environment variables (optional)

Create a `.env` file in the `services/forecasting` directory (see `.env.example` for reference):

```bash
cp .env.example .env
# Edit .env with your configuration
```

Currently, the service runs with default settings. Environment variables will be needed when database connections and advanced features are implemented.

### 7. Start the service

The service will read the port from the `.env` file (default: 8000). Start it with:

```bash
uvicorn app.main:app --reload --port ${PORT:-8000}
```

Or simply (if using the default port 8000):
```bash
uvicorn app.main:app --reload --port 8000
```

The `--reload` flag enables auto-reload on code changes (useful for development).

### 8. Verify the service is running

Visit `http://localhost:8000/health` in your browser or use curl:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "forecasting",
  "version": "0.1.0"
}
```

## Service Configuration

- **Default Port:** 8000 (configurable via `PORT` in `.env`)
- **Health Check Endpoint:** `GET /health`
- **API Documentation:** `http://localhost:8000/docs` (FastAPI auto-generated docs)
- **Alternative Docs:** `http://localhost:8000/redoc`

## Integration with Backend

The backend service expects the forecasting service to be available at:
- **URL:** `http://localhost:8000` (update `FORECASTING_SERVICE_URL` in backend `.env`)
- **Environment Variable:** `FORECASTING_SERVICE_URL` (set in backend `.env`)

Make sure the forecasting service is running before starting the backend service.

## Troubleshooting

### Port 8000 already in use

If port 8000 is already in use, you can change it in the `.env` file:

```bash
# Edit .env and change PORT to a different value
PORT=8001
```

Or specify a different port when starting:
```bash
uvicorn app.main:app --reload --port 8001
```

Then update `FORECASTING_SERVICE_URL` in the backend `.env` file accordingly.

### Prophet installation issues

If you encounter issues installing Prophet:

1. **On macOS:** Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

2. **On Linux:** Install build essentials:
   ```bash
   sudo apt-get install build-essential
   ```

3. **On Windows:** Install Visual C++ Build Tools or use conda instead of pip.

### Virtual environment not activating

Make sure you're in the correct directory and the virtual environment was created successfully. You should see `(.venv)` in your terminal prompt after activation.

## Development Workflow

1. Activate the virtual environment
2. Make code changes in `app/main.py` or other files
3. The service will auto-reload (if using `--reload` flag)
4. Test endpoints using the FastAPI docs at `http://localhost:8000/docs`

## Next Steps

- Add configuration management (environment variables, logging).
- Implement data access layer for historical cases and features.
- Create forecasting endpoints (batch and district-level).
- Integrate with modeling pipeline (Prophet/LSTM) and monitoring.

