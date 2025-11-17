"""Database connection and configuration"""
import os
import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# MongoDB connection
_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_mongodb_uri() -> str:
    """Get MongoDB connection URI from environment"""
    return os.getenv(
        "MONGODB_URI",
        "mongodb://localhost:27017/medsentinel"
    )


def connect_db() -> Database:
    """Connect to MongoDB and return database instance"""
    global _client, _db

    if _db is not None:
        return _db

    try:
        mongodb_uri = get_mongodb_uri()
        logger.info(f"Connecting to MongoDB: {mongodb_uri.split('@')[-1] if '@' in mongodb_uri else mongodb_uri}")
        
        _client = MongoClient(
            mongodb_uri,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
        )
        
        # Test connection
        _client.server_info()
        
        # Get database name from URI or use default
        db_name = mongodb_uri.split('/')[-1].split('?')[0] if '/' in mongodb_uri else 'medsentinel'
        _db = _client[db_name]
        
        logger.info(f"Successfully connected to MongoDB database: {db_name}")
        return _db
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise


def get_db() -> Database:
    """Get database instance (connects if not already connected)"""
    if _db is None:
        return connect_db()
    return _db


def close_db():
    """Close MongoDB connection"""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")

