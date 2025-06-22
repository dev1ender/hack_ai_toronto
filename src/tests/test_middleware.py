import requests
import time
import subprocess
import sys
import os

BASE_URL = "http://localhost:8000"

def test_request_logging():
    """Test that requests are being logged properly"""
    print("\n--- Testing Request/Response Logging Middleware ---")
    
    try:
        # Test 1: Health check (should be skipped)
        print("1. Testing health check (should be skipped from logs)...")
        response = requests.get(f"{BASE_URL}/")
        print(f"   Health check: {response.status_code}")
        
        # Test 2: Regular API call
        print("2. Testing regular API call (should be logged)...")
        response = requests.get(f"{BASE_URL}/voices")
        print(f"   Voices API: {response.status_code}")
        
        # Test 3: POST request with data
        print("3. Testing POST request (should be logged)...")
        test_data = {"text": "Test", "voice_id": "nPczCjzI2devNBz1zQrb"}
        response = requests.post(f"{BASE_URL}/text-to-speech", json=test_data)
        print(f"   TTS API: {response.status_code}")
        
        # Test 4: Non-existent endpoint (should log error)
        print("4. Testing 404 endpoint (should log warning)...")
        response = requests.get(f"{BASE_URL}/non-existent")
        print(f"   404 endpoint: {response.status_code}")
        
        # Test 5: Check for Request-ID header
        print("5. Checking for X-Request-ID header...")
        response = requests.get(f"{BASE_URL}/voices")
        request_id = response.headers.get("X-Request-ID")
        if request_id:
            print(f"   Request ID found: {request_id}")
        else:
            print("   ❌ Request ID header not found")
        
        print("✅ Middleware testing completed!")
        print("\n📝 Check the logs in:")
        print("   - Console output above")
        print("   - backend.log file")
        print("   - Look for lines starting with 'Request started' and 'Request completed'")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error testing middleware: {e}")
        print("Make sure the backend is running with 'make dev-backend'")

def test_performance_logging():
    """Test performance logging for slow requests"""
    print("\n--- Testing Performance Logging ---")
    
    try:
        # Make a request that might be slow
        print("Testing potential slow request...")
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/voices")
        duration = time.time() - start_time
        
        print(f"Request took {duration:.3f}s (threshold is 2.0s)")
        if duration > 2.0:
            print("This should appear as a slow request warning in logs")
        else:
            print("Request was fast - no slow request warning expected")
            
    except Exception as e:
        print(f"❌ Error testing performance logging: {e}")

if __name__ == "__main__":
    print("🧪 Testing Logging Middleware...")
    test_request_logging()
    test_performance_logging()
    print("\n🎉 Middleware tests completed!") 