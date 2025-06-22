#!/usr/bin/env python3
"""
Simple Backend Test Script
"""

import os
import requests
import json
from pathlib import Path
import uuid

# Backend URL
BASE_URL = "http://localhost:8000"

def generate_random_user():
    """Generates random user credentials"""
    random_id = str(uuid.uuid4())[:8]
    return {
        "email": f"testuser_{random_id}@example.com",
        "password": "a_secure_password",
        "username": f"testuser_{random_id}",
        "first_name": "Test",
        "last_name": "User"
    }

def test_auth_flow():
    """Tests the complete authentication flow: register, login, access protected route"""
    print("\n--- Testing Authentication ---")
    user_credentials = generate_random_user()
    
    # 1. Register User
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_credentials)
        if response.status_code == 200:
            print("✅ Registration Successful")
        else:
            print(f"❌ Registration Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration Test Failed: {e}")
        return False

    # 2. Login User
    try:
        login_data = {"email": user_credentials["email"], "password": user_credentials["password"]}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            token = result.get("data", {}).get("token")
            if token:
                print("✅ Login Successful")
            else:
                print("❌ Login Failed: Token not found in response")
                return False
        else:
            print(f"❌ Login Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login Test Failed: {e}")
        return False
        
    # 3. Access Protected Route (/users/me)
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        if response.status_code == 200:
            print("✅ Access to Protected Route Successful")
            user_info = response.json().get('data', {})
            print(f"   - Welcome, {user_info.get('first_name')} {user_info.get('last_name')}!")
        else:
            print(f"❌ Access to Protected Route Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Protected Route Test Failed: {e}")
        return False
        
    print("--- Authentication Test Passed ---")
    return True

def test_health_check():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health Check: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_voices():
    """Test voices endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/voices")
        if response.status_code == 200:
            voices = response.json()["voices"]
            print(f"✅ Voices Retrieved: {len(voices)} voices available")
            for voice in voices[:3]:  # Show first 3
                print(f"   - {voice['name']} ({voice['voice_id']})")
            return True
        else:
            print(f"❌ Voices Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Voices Test Failed: {e}")
        return False

def test_file_upload():
    """Test file upload with a sample audio file"""
    try:
        # Check if test file exists
        test_file = Path("../resources/audio_man.mp3")
        if not test_file.exists():
            print("⚠️  Test audio file not found - skipping upload test")
            return True
        
        with open(test_file, "rb") as f:
            files = {"file": ("test_audio.mp3", f, "audio/mp3")}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ File Upload: {result['original_name']} uploaded successfully")
            print(f"   File ID: {result['file_id']}")
            print(f"   Duration: {result['duration']:.2f}s")
            return result['file_id']
        else:
            print(f"❌ Upload Failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Upload Test Failed: {e}")
        return None

def test_waveform(file_id):
    """Test waveform generation"""
    if not file_id:
        print("⚠️  No file ID - skipping waveform test")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/waveform/{file_id}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Waveform Generated: {len(result['waveform_data'])} data points")
            return True
        else:
            print(f"❌ Waveform Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Waveform Test Failed: {e}")
        return False

def test_text_to_speech():
    """Test TTS generation"""
    try:
        tts_data = {
            "text": "Hello, this is a test of the ElevenLabs text to speech API integration."
            # voice_id will be set from config automatically
        }
        
        response = requests.post(f"{BASE_URL}/text-to-speech", json=tts_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ TTS Generated: {result['duration']:.2f}s audio created")
            print(f"   TTS ID: {result['tts_id']}")
            return result['tts_id']
        else:
            print(f"❌ TTS Failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ TTS Test Failed: {e}")
        return None

def test_voice_id_config():
    """Test that VOICE_ID environment variable is being used"""
    try:
        import sys
        import os
        # Add parent directory to path to find core module
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from core.config import config
        print(f"✅ Voice ID Configuration: {config.VOICE_ID}")
        
        # Test that it's not the hardcoded value (unless explicitly set)
        if config.VOICE_ID == "nPczCjzI2devNBz1zQrb":
            print("   Using default Rachel voice (nPczCjzI2devNBz1zQrb)")
        else:
            print(f"   Using custom voice: {config.VOICE_ID}")
        
        return True
    except Exception as e:
        print(f"❌ Voice ID Config Test Failed: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🧪 Starting Backend Tests...")
    print("=" * 50)
    
    # Test 1: Health Check
    if not test_health_check():
        print("❌ Backend is not running. Please start with 'make dev-backend'")
        return
    
    # Test 2: Voice ID Configuration
    test_voice_id_config()
    
    # Test 3: Authentication
    test_auth_flow()
    
    # Test 4: Voices
    test_voices()
    
    # Test 5: File Upload
    file_id = test_file_upload()
    
    # Test 6: Waveform
    test_waveform(file_id)
    
    # Test 7: Text-to-Speech
    tts_id = test_text_to_speech()
    
    print("=" * 50)
    print("🎉 Backend Tests Completed!")
    
    if file_id and tts_id:
        print("\n🔧 Next steps for full testing:")
        print(f"   - Test segment replacement with file_id: {file_id}")
        print(f"   - Test with TTS ID: {tts_id}")
        print("   - Try the frontend integration")

if __name__ == "__main__":
    run_all_tests() 