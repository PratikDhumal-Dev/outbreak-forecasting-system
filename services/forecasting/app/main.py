import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import ForecastRequest, ForecastResponse, BatchForecastRequest
from app.forecast_service import ForecastService
from app.data_access import DataAccess
from app.db import connect_db, close_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
forecast_service = ForecastService()
# DataAccess will be initialized after DB connection
data_access = None


def create_app() -> FastAPI:
    app = FastAPI(
        title="MedSentinel Forecasting Service",
        version="0.1.0",
        description="AI-powered disease outbreak forecasting service using Prophet"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup_event():
        """Initialize database connection on startup"""
        global data_access
        try:
            connect_db()
            data_access = DataAccess()
            logger.info("Database connection initialized")
        except Exception as e:
            logger.warning(f"Database connection failed: {str(e)}. Service will continue but DB features may not work.")
            data_access = None

    @app.on_event("shutdown")
    async def shutdown_event():
        """Close database connection on shutdown"""
        close_db()
        logger.info("Application shutdown complete")

    @app.get("/health", tags=["system"])
    async def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
            db_status = "connected"
            try:
                from app.db import get_db
                get_db().command("ping")
            except Exception:
                db_status = "disconnected"
            
            return {
                "status": "ok",
                "service": "forecasting",
                "version": app.version,
                "database": db_status
            }
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return {
                "status": "error",
                "service": "forecasting",
                "version": app.version,
                "error": str(e)
            }

    @app.post("/forecast", response_model=ForecastResponse, tags=["forecasting"])
    async def generate_forecast(request: ForecastRequest):
        """
        Generate disease outbreak forecast for a region
        
        If historical_data is not provided, it will be fetched from MongoDB.
        Requires at least 7 days of historical data. Returns forecast for the specified
        number of days (default 14, max 30) with risk scores and confidence intervals.
        """
        try:
            logger.info(f"Generating forecast for {request.region}/{request.district}, {request.disease}")
            
            # Fetch historical data from DB if not provided
            if request.historical_data is None:
                if data_access is None:
                    raise HTTPException(
                        status_code=503,
                        detail="Database not available. Please provide historical_data in the request."
                    )
                
                logger.info(f"Fetching historical data from database ({request.historical_days} days)")
                historical_data = data_access.fetch_historical_cases(
                    region=request.region,
                    district=request.district,
                    state=request.state,
                    disease=request.disease,
                    days=request.historical_days
                )
                
                if len(historical_data) < 7:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Insufficient historical data. Found {len(historical_data)} days, minimum 7 days required."
                    )
                
                # Update request with fetched data
                request.historical_data = historical_data
            
            forecast = forecast_service.generate_forecast(request)
            return forecast
            
        except HTTPException:
            raise
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    @app.post("/forecast/batch", tags=["forecasting"])
    async def batch_forecast(batch_request: BatchForecastRequest):
        """
        Batch forecasting endpoint
        
        Process multiple forecast requests at once (max 50 requests).
        Returns forecasts for all requested regions/diseases.
        """
        try:
            logger.info(f"Processing batch forecast with {len(batch_request.requests)} requests")
            
            results = []
            errors = []
            
            for idx, request in enumerate(batch_request.requests):
                try:
                    # Fetch historical data from DB if not provided
                    if request.historical_data is None:
                        if data_access is None:
                            errors.append({
                                "index": idx,
                                "region": request.region,
                                "district": request.district,
                                "disease": request.disease,
                                "error": "Database not available. Please provide historical_data in the request."
                            })
                            continue
                        
                        historical_data = data_access.fetch_historical_cases(
                            region=request.region,
                            district=request.district,
                            state=request.state,
                            disease=request.disease,
                            days=request.historical_days
                        )
                        
                        if len(historical_data) < 7:
                            errors.append({
                                "index": idx,
                                "region": request.region,
                                "district": request.district,
                                "disease": request.disease,
                                "error": f"Insufficient historical data: {len(historical_data)} days"
                            })
                            continue
                        
                        request.historical_data = historical_data
                    
                    forecast = forecast_service.generate_forecast(request)
                    results.append(forecast)
                    
                except Exception as e:
                    logger.error(f"Error processing request {idx}: {str(e)}")
                    errors.append({
                        "index": idx,
                        "region": request.region,
                        "district": request.district,
                        "disease": request.disease,
                        "error": str(e)
                    })
            
            return {
                "success": len(results),
                "errors": len(errors),
                "forecasts": results,
                "error_details": errors
            }
            
        except Exception as e:
            logger.error(f"Batch forecast error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Batch forecast failed: {str(e)}")

    @app.get("/regions", tags=["data"])
    async def get_available_regions(disease: str = None):
        """
        Get list of available regions with case data
        
        Optionally filter by disease type.
        """
        try:
            if data_access is None:
                raise HTTPException(
                    status_code=503,
                    detail="Database not available"
                )
            
            regions = data_access.get_available_regions(disease=disease)
            return {
                "count": len(regions),
                "regions": regions
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching regions: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to fetch regions: {str(e)}")

    return app


app = create_app()

