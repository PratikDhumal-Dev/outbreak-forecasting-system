from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class HistoricalCase(BaseModel):
    """Historical case data point"""
    date: datetime
    cases: int = Field(ge=0, description="Number of cases on this date")
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None


class ForecastRequest(BaseModel):
    """Request model for generating forecasts"""
    region: str = Field(..., description="Region name")
    district: str = Field(..., description="District name")
    state: str = Field(..., description="State name")
    disease: str = Field(..., description="Disease type")
    historical_data: Optional[List[HistoricalCase]] = Field(default=None, description="Historical case data (optional, will fetch from DB if not provided)")
    forecast_days: int = Field(default=14, ge=1, le=30, description="Number of days to forecast (1-30)")
    historical_days: int = Field(default=90, ge=7, le=365, description="Number of days of history to fetch from DB (if historical_data not provided)")


class BatchForecastRequest(BaseModel):
    """Request model for batch forecasting"""
    requests: List[ForecastRequest] = Field(..., min_items=1, max_items=50, description="List of forecast requests (max 50)")


class ForecastPoint(BaseModel):
    """Single forecast point"""
    date: datetime
    predicted_cases: float = Field(ge=0, description="Predicted number of cases")
    lower_bound: float = Field(ge=0, description="Lower confidence bound")
    upper_bound: float = Field(ge=0, description="Upper confidence bound")


class ForecastResponse(BaseModel):
    """Response model for forecasts"""
    region: str
    district: str
    state: str
    disease: str
    forecast_date: datetime
    forecast_points: List[ForecastPoint]
    risk_score: float = Field(ge=0, le=1, description="Overall risk score (0-1)")
    risk_level: str = Field(..., description="Risk level: low, medium, high, critical")
    confidence: float = Field(ge=0, le=1, description="Model confidence (0-1)")
    model_version: str = Field(default="1.0.0", description="Model version used")
    
    class Config:
        protected_namespaces = ()  # Fix Pydantic warning about model_version
