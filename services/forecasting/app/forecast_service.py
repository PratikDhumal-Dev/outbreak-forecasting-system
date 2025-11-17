import logging
from datetime import datetime, timedelta
from typing import List

import pandas as pd
import numpy as np

from app.models import ForecastRequest, ForecastResponse, ForecastPoint, HistoricalCase

logger = logging.getLogger(__name__)

# Try to import Prophet, fallback to simple forecasting if not available
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except (ImportError, AttributeError) as e:
    logger.warning(f"Prophet not available: {e}. Using simple forecasting method.")
    PROPHET_AVAILABLE = False


class ForecastService:
    """Service for generating disease outbreak forecasts using Prophet"""

    def __init__(self):
        self.model_version = "1.0.0"

    def calculate_risk_score(self, forecast_points: List[ForecastPoint], historical_avg: float) -> float:
        """Calculate overall risk score based on forecast trends"""
        if not forecast_points or historical_avg == 0:
            return 0.0

        # Calculate average predicted cases for next 7 days
        next_7_days = forecast_points[:7]
        avg_predicted = sum(p.predicted_cases for p in next_7_days) / len(next_7_days)

        # Risk score based on predicted increase
        if historical_avg == 0:
            return min(avg_predicted / 100, 1.0)  # Normalize to 0-1

        increase_ratio = avg_predicted / historical_avg if historical_avg > 0 else 0
        risk_score = min(increase_ratio / 2.0, 1.0)  # Cap at 1.0

        return max(0.0, min(1.0, risk_score))

    def determine_risk_level(self, risk_score: float) -> str:
        """Determine risk level from risk score"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif risk_score >= 0.3:
            return "medium"
        else:
            return "low"

    def calculate_confidence(self, historical_data: List[HistoricalCase]) -> float:
        """Calculate model confidence based on data quality"""
        if len(historical_data) < 14:
            return 0.6  # Low confidence with limited data
        elif len(historical_data) < 30:
            return 0.75  # Medium confidence
        else:
            return 0.85  # High confidence with sufficient data

    def generate_simple_forecast(self, request: ForecastRequest) -> ForecastResponse:
        """Generate forecast using simple moving average and trend analysis"""
        try:
            # Prepare historical data
            historical_df = pd.DataFrame([
                {
                    'ds': case.date,
                    'y': case.cases
                }
                for case in request.historical_data
            ])

            # Ensure dates are sorted
            historical_df = historical_df.sort_values('ds').reset_index(drop=True)
            historical_avg = historical_df['y'].mean()

            # Calculate trend (simple linear regression)
            x = np.arange(len(historical_df))
            y = historical_df['y'].values
            coeffs = np.polyfit(x, y, 1)  # Linear fit
            trend = coeffs[0]  # Slope

            # Calculate moving average (last 7 days)
            window = min(7, len(historical_df))
            recent_avg = historical_df['y'].tail(window).mean()
            recent_std = historical_df['y'].tail(window).std()

            # Generate forecast points
            forecast_points = []
            last_date = historical_df['ds'].iloc[-1]
            last_value = historical_df['y'].iloc[-1]

            for i in range(1, request.forecast_days + 1):
                forecast_date = last_date + timedelta(days=i)
                
                # Simple trend-based prediction
                predicted = last_value + (trend * i)
                
                # Add some seasonality (weekly pattern)
                day_of_week = forecast_date.weekday()
                weekly_factor = 1.0 + 0.1 * np.sin(2 * np.pi * day_of_week / 7)
                predicted = predicted * weekly_factor
                
                # Ensure non-negative
                predicted = max(0, predicted)
                
                # Calculate confidence intervals (80%)
                std_multiplier = 1.28  # For 80% CI
                lower = max(0, predicted - std_multiplier * recent_std)
                upper = predicted + std_multiplier * recent_std

                forecast_points.append(
                    ForecastPoint(
                        date=forecast_date,
                        predicted_cases=round(predicted, 2),
                        lower_bound=round(lower, 2),
                        upper_bound=round(upper, 2)
                    )
                )

            # Calculate risk metrics
            risk_score = self.calculate_risk_score(forecast_points, historical_avg)
            risk_level = self.determine_risk_level(risk_score)
            confidence = self.calculate_confidence(request.historical_data)

            return ForecastResponse(
                region=request.region,
                district=request.district,
                state=request.state,
                disease=request.disease,
                forecast_date=datetime.now(),
                forecast_points=forecast_points,
                risk_score=round(risk_score, 3),
                risk_level=risk_level,
                confidence=round(confidence, 3),
                model_version=f"{self.model_version}-simple"
            )

        except Exception as e:
            logger.error(f"Error generating simple forecast: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to generate forecast: {str(e)}")

    def generate_forecast(self, request: ForecastRequest) -> ForecastResponse:
        """Generate forecast using Prophet model or fallback to simple method"""
        # Validate historical data
        if request.historical_data is None or len(request.historical_data) < 7:
            raise ValueError("At least 7 days of historical data is required")
        
        # Try Prophet first if available
        if PROPHET_AVAILABLE:
            try:
                return self._generate_prophet_forecast(request)
            except Exception as e:
                logger.warning(f"Prophet forecast failed: {str(e)}. Falling back to simple method.")
                return self.generate_simple_forecast(request)
        else:
            return self.generate_simple_forecast(request)

    def _generate_prophet_forecast(self, request: ForecastRequest) -> ForecastResponse:
        """Generate forecast using Prophet model"""
        try:
            # Prepare historical data
            historical_df = pd.DataFrame([
                {
                    'ds': case.date,
                    'y': case.cases
                }
                for case in request.historical_data
            ])

            # Ensure dates are sorted
            historical_df = historical_df.sort_values('ds').reset_index(drop=True)

            # Calculate historical average for risk scoring
            historical_avg = historical_df['y'].mean()

            # Initialize and fit Prophet model
            model = Prophet(
                yearly_seasonality=False,  # Disable yearly seasonality for short-term forecasts
                weekly_seasonality=True,    # Enable weekly patterns
                daily_seasonality=False,
                changepoint_prior_scale=0.05,  # Control flexibility
                interval_width=0.80,  # 80% confidence interval
            )

            # Add additional regressors if available
            if any(case.temperature is not None for case in request.historical_data):
                model.add_regressor('temperature')
                historical_df['temperature'] = [case.temperature or historical_df['y'].mean() 
                                                for case in request.historical_data]

            model.fit(historical_df)

            # Create future dataframe
            future = model.make_future_dataframe(periods=request.forecast_days)

            # Add regressors to future dataframe (use last known values)
            if 'temperature' in historical_df.columns:
                last_temp = historical_df['temperature'].iloc[-1]
                future['temperature'] = last_temp

            # Generate forecast
            forecast = model.predict(future)

            # Extract only future predictions (last forecast_days rows)
            future_forecast = forecast.tail(request.forecast_days)

            # Convert to ForecastPoint list
            forecast_points = [
                ForecastPoint(
                    date=row['ds'],
                    predicted_cases=max(0, round(row['yhat'], 2)),
                    lower_bound=max(0, round(row['yhat_lower'], 2)),
                    upper_bound=max(0, round(row['yhat_upper'], 2))
                )
                for _, row in future_forecast.iterrows()
            ]

            # Calculate risk metrics
            risk_score = self.calculate_risk_score(forecast_points, historical_avg)
            risk_level = self.determine_risk_level(risk_score)
            confidence = self.calculate_confidence(request.historical_data)

            return ForecastResponse(
                region=request.region,
                district=request.district,
                state=request.state,
                disease=request.disease,
                forecast_date=datetime.now(),
                forecast_points=forecast_points,
                risk_score=round(risk_score, 3),
                risk_level=risk_level,
                confidence=round(confidence, 3),
                model_version=self.model_version
            )

        except Exception as e:
            logger.error(f"Error generating Prophet forecast: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to generate Prophet forecast: {str(e)}")
