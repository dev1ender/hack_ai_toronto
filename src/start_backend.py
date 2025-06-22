#!/usr/bin/env python3
"""
Audio Editor Backend Startup Script
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file in the project root
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Add src directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.config import config

# List of required tables
REQUIRED_TABLES = {
    'users', 'projects', 'videos', 'audio_files',
    'audio_segments', 'transcription_lines', 'edit_requests'
}

def run_health_checks():
    """Performs all pre-startup health checks."""
    print("--- Running Pre-startup Health Checks ---")
    
    # 1. Check Database Connection & Tables
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable is not set.")
        print("   Please create a .env file from .env.example and set your database URL.")
        sys.exit(1)

    try:
        engine = create_engine(db_url)
        with engine.connect() as connection:
            print("✅ Database connection successful.")
            
            # 2. Check for required tables
            inspector = inspect(engine)
            existing_tables = set(inspector.get_table_names())
            missing_tables = REQUIRED_TABLES - existing_tables
            
            if missing_tables:
                print(f"❌ Error: Missing required database tables: {', '.join(missing_tables)}")
                print("   Please run 'alembic upgrade head' to create them.")
                sys.exit(1)
            
            print("✅ All required database tables are present.")

    except OperationalError as e:
        print(f"❌ Error: Database connection failed.")
        print(f"   Details: {e}")
        print("   Please ensure the database server is running and accessible.")
        sys.exit(1)
        
    # 3. Check for API Keys
    if not config.ELEVENLABS_API_KEY:
        print("⚠️ Warning: ELEVENLABS_API_KEY is not set. Text-to-speech features will be disabled.")
    else:
        print("✅ ElevenLabs API Key is set.")
        
    # 4. Check Voice ID
    print(f"🎤 Voice ID: {config.VOICE_ID}")
        
    print("--- Health Checks Passed ---")

def main():
    """Start the FastAPI server"""
    
    # Run pre-startup checks
    run_health_checks()
    
    print("\n🎵 Starting Audio Editor Backend...")
    print(f"🔧 Environment: {'Development' if config.DEBUG else 'Production'}")
    print(f"🌐 Server: http://{config.HOST}:{config.PORT}")
    print(f"📋 API Docs: http://{config.HOST}:{config.PORT}/docs")
    
    # Create necessary directories
    directories = [config.TEMP_DIR, config.UPLOAD_DIR, config.OUTPUT_DIR]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 Created directory: {directory}")
    
    # Start the server
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info" if config.DEBUG else "warning"
    )

if __name__ == "__main__":
    main() 