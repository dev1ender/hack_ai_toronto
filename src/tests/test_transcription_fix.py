#!/usr/bin/env python3
"""
Test script to verify transcription timestamp fixes
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_transcription_timestamps():
    """Test that transcription API returns proper timestamps"""
    print("\n🧪 Testing Transcription Timestamp Fix...")
    
    # You'll need to replace these with actual values from your system
    PROJECT_ID = "YOUR_PROJECT_ID_HERE"  # Replace with actual project ID
    TOKEN = "YOUR_AUTH_TOKEN_HERE"      # Replace with actual auth token
    
    if PROJECT_ID == "YOUR_PROJECT_ID_HERE" or TOKEN == "YOUR_AUTH_TOKEN_HERE":
        print("❌ Please update the test script with actual PROJECT_ID and TOKEN")
        print("   1. Create a project and get its ID")
        print("   2. Login and get an auth token")
        print("   3. Update this script with those values")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {TOKEN}"}
        response = requests.get(f"{BASE_URL}/projects/{PROJECT_ID}/transcripts", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return False
        
        data = response.json()
        
        if not data.get("success"):
            print(f"❌ API returned error: {data.get('error')}")
            return False
        
        transcription = data.get("data", {})
        segments = transcription.get("segments", [])
        
        if not segments:
            print("❌ No transcript segments found")
            return False
        
        print(f"✅ Found {len(segments)} transcript segments")
        
        # Check timestamps in first few segments
        timestamp_issues = 0
        for i, segment in enumerate(segments[:3]):
            start_time = segment.get("startTime")
            end_time = segment.get("endTime")
            text = segment.get("text", "")[:50]
            
            print(f"   Segment {i+1}: start={start_time}, end={end_time}, text='{text}...'")
            
            if start_time is None or end_time is None:
                timestamp_issues += 1
                print(f"     ❌ Missing timestamps!")
            else:
                print(f"     ✅ Timestamps present")
        
        if timestamp_issues == 0:
            print(f"\n🎉 SUCCESS: All segments have timestamps!")
            return True
        else:
            print(f"\n❌ FAILED: {timestamp_issues} segments missing timestamps")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def get_sample_project_info():
    """Helper to get project info for testing"""
    print("\n📋 To test transcription fixes:")
    print("1. Start the backend: make dev-backend")
    print("2. Register/login to get an auth token")
    print("3. Create a project with a video file")
    print("4. Wait for transcription to complete")
    print("5. Update this test script with PROJECT_ID and TOKEN")
    print("6. Run: python src/tests/test_transcription_fix.py")

if __name__ == "__main__":
    print("🎵 Transcription Timestamp Fix Test")
    print("=" * 50)
    
    success = test_transcription_timestamps()
    
    if not success:
        get_sample_project_info()
    
    print("\n" + "=" * 50) 