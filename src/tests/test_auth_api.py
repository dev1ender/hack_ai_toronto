import os
import sys
import time
import subprocess
import requests
import uuid

# --- Configuration ---
BASE_URL = "http://localhost:8000"
# Ensure the script can find the project's root and source directories
PROJ_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(PROJ_ROOT)
sys.path.append(os.path.join(PROJ_ROOT, "src"))

# --- Test User Data ---
TEST_USERNAME = f"testuser_{uuid.uuid4().hex[:8]}"
TEST_EMAIL = f"test_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "a_secure_password"

# --- Helper Functions ---
def print_header(title):
    """Prints a formatted header for test sections."""
    print("\n" + "="*50)
    print(f" {title}")
    print("="*50)

def print_status(message, success=True):
    """Prints a status message with a checkmark or cross."""
    symbol = "✅" if success else "❌"
    print(f" {symbol} {message}")

def start_backend():
    """Starts the backend server as a subprocess."""
    print_header("Starting Backend Server")
    command = ["make", "dev-backend"]
    try:
        process = subprocess.Popen(command, cwd=PROJ_ROOT, preexec_fn=os.setsid)
        print_status("Backend server process started.")
        # Give the server a moment to start up
        time.sleep(5)
        return process
    except Exception as e:
        print_status(f"Failed to start backend server: {e}", success=False)
        sys.exit(1)

def stop_backend(process):
    """Stops the backend server process."""
    print_header("Stopping Backend Server")
    try:
        os.killpg(os.getpgid(process.pid), 9)
        print_status("Backend server process stopped.")
    except Exception as e:
        print_status(f"Failed to stop backend server: {e}", success=False)

# --- Test Functions ---
def test_register_user():
    """Tests the /auth/register endpoint."""
    print_header("Testing User Registration")
    url = f"{BASE_URL}/auth/register"
    payload = {
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        response_data = response.json()
        
        print_status("Registration request successful.")

        assert "data" in response_data, "Response missing 'data' key"
        auth_data = response_data["data"]
        
        assert "user" in auth_data and "token" in auth_data, "Response missing 'user' or 'token'."
        assert auth_data["user"]["email"] == TEST_EMAIL, "Registered email does not match."
        print_status("User data and token validated.")
        
    except requests.exceptions.RequestException as e:
        print_status(f"Registration failed: {e}", success=False)
        if e.response:
            print(f"Response body: {e.response.text}")
        return False
    return True

def test_login_user():
    """Tests the /auth/login endpoint."""
    print_header("Testing User Login")
    url = f"{BASE_URL}/auth/login"
    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        response_data = response.json()

        print_status("Login request successful.")

        assert "data" in response_data, "Response missing 'data' key"
        auth_data = response_data["data"]

        assert "token" in auth_data, "Response missing 'token'."
        print_status("Access token validated.")
        
    except requests.exceptions.RequestException as e:
        print_status(f"Login failed: {e}", success=False)
        if e.response:
            print(f"Response body: {e.response.text}")
        return False
    return True

# --- Main Execution ---
def main():
    """Main function to run the auth test suite."""
    backend_process = start_backend()
    
    try:
        # Run tests
        registration_ok = test_register_user()
        login_ok = False
        if registration_ok:
            login_ok = test_login_user()

        print_header("Test Summary")
        print_status("User Registration", success=registration_ok)
        print_status("User Login", success=login_ok)

        if not all([registration_ok, login_ok]):
            sys.exit(1)

    finally:
        stop_backend(backend_process)
        print("\nAuth test suite finished.")

if __name__ == "__main__":
    main() 