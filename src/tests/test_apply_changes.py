import requests
import json
import argparse

def test_apply_changes(token, project_id, transcript_id):
    """
    Sends a request to the /apply-changes endpoint to test the functionality.
    Now includes multiple changes in the same line to test the grouping fix.
    """
    url = f"http://localhost:8000/projects/{project_id}/apply-changes"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "*/*",
    }

    # Test multiple changes in the same transcript line
    data = {
        "changes": [
            {
                "id": "1750573864222",
                "transcriptId": transcript_id,
                "timestamp": "00:00",
                "oldText": "slice",
                "newText": "spice",
                "startIndex": 24,
                "endIndex": 29,
                "changeTime": "2:31:04 AM"
            },
            {
                "id": "1750573864223",
                "transcriptId": transcript_id,  # Same transcript line
                "timestamp": "00:00",
                "oldText": "should",
                "newText": "must",
                "startIndex": 10,
                "endIndex": 16,
                "changeTime": "2:31:05 AM"
            },
            {
                "id": "1750573864224", 
                "transcriptId": transcript_id,  # Same transcript line again
                "timestamp": "00:00",
                "oldText": "order",
                "newText": "buy",
                "startIndex": 32,
                "endIndex": 37,
                "changeTime": "2:31:06 AM"
            }
        ]
    }

    print(f"Sending POST request to {url}")
    print(f"Headers: {headers}")
    print(f"Testing {len(data['changes'])} changes in the same transcript line")
    print(f"This should generate only 1 audio clip instead of {len(data['changes'])} clips")
    print(f"Data: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        print("\nRequest successful!")
        print(f"Status code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))

    except requests.exceptions.RequestException as e:
        print(f"\nAn error occurred: {e}")
        if e.response:
            print(f"Status code: {e.response.status_code}")
            try:
                print("Error response:")
                print(json.dumps(e.response.json(), indent=2))
            except json.JSONDecodeError:
                print(e.response.text)

def test_apply_changes_multiple_lines(token, project_id, transcript_id_1, transcript_id_2):
    """
    Test changes across multiple different transcript lines
    """
    url = f"http://localhost:8000/projects/{project_id}/apply-changes"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "*/*",
    }

    # Test changes across different transcript lines
    data = {
        "changes": [
            {
                "id": "1750573864225",
                "transcriptId": transcript_id_1,
                "timestamp": "00:00",
                "oldText": "hello",
                "newText": "hi",
                "startIndex": 0,
                "endIndex": 5,
                "changeTime": "2:31:07 AM"
            },
            {
                "id": "1750573864226",
                "transcriptId": transcript_id_2,  # Different transcript line
                "timestamp": "00:05",
                "oldText": "world",
                "newText": "earth",
                "startIndex": 6,
                "endIndex": 11,
                "changeTime": "2:31:08 AM"
            }
        ]
    }

    print(f"\n--- Testing changes across multiple lines ---")
    print(f"This should generate {len(set([c['transcriptId'] for c in data['changes']]))} audio clips")
    print(f"Data: {json.dumps(data, indent=2)}")

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        print("\nMultiple lines test successful!")
        print(f"Status code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))

    except requests.exceptions.RequestException as e:
        print(f"\nMultiple lines test error: {e}")
        if e.response:
            print(f"Status code: {e.response.status_code}")
            try:
                print("Error response:")
                print(json.dumps(e.response.json(), indent=2))
            except json.JSONDecodeError:
                print(e.response.text)

if __name__ == "__main__":
    # Replace with actual values from your system
    project_id = "7228e812-bd0c-46a6-9468-2376ff4705dc"
    transcript_id = "416364f4-5138-47d7-9c3e-9f711cff01ca"
    transcript_id_2 = "416364f4-5138-47d7-9c3e-9f711cff01cb"  # Different line
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrYWlAZXhhbXBsZS5jb20iLCJleHAiOjE3NTA1Nzg3MzN9.JB2qvcrPejmT4NButfLU-p7l9EgQUVk3mlJUXbwxC64"
    
    print("🧪 Testing Apply Changes Fix - Multiple Changes per Line")
    print("=" * 60)
    
    # Test 1: Multiple changes in same line (should create only 1 audio clip)
    test_apply_changes(token, project_id, transcript_id)
    
    # Test 2: Changes across different lines (should create 2 audio clips) 
    # test_apply_changes_multiple_lines(token, project_id, transcript_id, transcript_id_2) 