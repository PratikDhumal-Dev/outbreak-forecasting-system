"""Data access layer for fetching historical case data from MongoDB"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pymongo.collection import Collection

from app.db import get_db
from app.models import HistoricalCase

logger = logging.getLogger(__name__)


class DataAccess:
    """Data access layer for case data"""

    def __init__(self):
        self.db = get_db()
        self.cases_collection: Collection = self.db.cases

    def fetch_historical_cases(
        self,
        region: str,
        district: str,
        state: str,
        disease: str,
        days: int = 90,
        end_date: Optional[datetime] = None
    ) -> List[HistoricalCase]:
        """
        Fetch historical case data from MongoDB
        
        Args:
            region: Region name
            district: District name
            state: State name
            disease: Disease type
            days: Number of days of history to fetch (default: 90)
            end_date: End date for query (default: today)
            
        Returns:
            List of HistoricalCase objects sorted by date
        """
        try:
            if end_date is None:
                end_date = datetime.now()
            
            start_date = end_date - timedelta(days=days)
            
            # Build query
            query = {
                "region": region,
                "district": district,
                "state": state,
                "disease": disease,
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
            
            logger.info(
                f"Fetching historical cases: {region}/{district}/{state}, "
                f"{disease}, {days} days"
            )
            
            # Fetch cases from MongoDB
            cases = self.cases_collection.find(query).sort("date", 1)
            
            # Convert to HistoricalCase objects
            historical_cases = []
            for case in cases:
                historical_cases.append(
                    HistoricalCase(
                        date=case["date"],
                        cases=case.get("newCases", 0),
                        temperature=case.get("temperature"),
                        humidity=case.get("humidity"),
                        rainfall=case.get("rainfall")
                    )
                )
            
            logger.info(f"Fetched {len(historical_cases)} historical cases")
            
            if len(historical_cases) < 7:
                logger.warning(
                    f"Only {len(historical_cases)} cases found. "
                    "At least 7 days of data recommended for accurate forecasting."
                )
            
            return historical_cases
            
        except Exception as e:
            logger.error(f"Error fetching historical cases: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to fetch historical data: {str(e)}")

    def get_available_regions(self, disease: Optional[str] = None) -> List[dict]:
        """
        Get list of available regions with case data
        
        Args:
            disease: Optional disease filter
            
        Returns:
            List of dictionaries with region, district, state, disease info
        """
        try:
            query = {}
            if disease:
                query["disease"] = disease
            
            # Use aggregation to get distinct combinations
            pipeline = [
                {"$match": query},
                {
                    "$group": {
                        "_id": {
                            "region": "$region",
                            "district": "$district",
                            "state": "$state",
                            "disease": "$disease"
                        },
                        "latest_date": {"$max": "$date"},
                        "case_count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "region": "$_id.region",
                        "district": "$_id.district",
                        "state": "$_id.state",
                        "disease": "$_id.disease",
                        "latest_date": 1,
                        "case_count": 1
                    }
                },
                {"$sort": {"region": 1, "district": 1}}
            ]
            
            results = list(self.cases_collection.aggregate(pipeline))
            logger.info(f"Found {len(results)} available region/disease combinations")
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching available regions: {str(e)}", exc_info=True)
            return []

