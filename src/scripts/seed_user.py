import httpx
import json
import asyncio

BASE_URL = "http://localhost:8000"

async def seed_user():
    url = f"{BASE_URL}/auth/register"
    user_data = {
        "email": "hackai@example.com",
        "password": "LetsDoIt@2025",
        "username": "hackai",
        "first_name": "Hack",
        "last_name": "AI"
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"Attempting to connect to {url}...")
            response = await client.post(url, json=user_data, headers=headers)
            print(f"Received response with status code: {response.status_code}")
            response.raise_for_status()
            
            print("User seeded successfully!")
            print("Response:", response.json())
            
    except httpx.HTTPStatusError as e:
        print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
    except httpx.RequestError as e:
        print(f"An error occurred while requesting {e.request.url!r}.")
        print(f"Error details: {e}")

if __name__ == "__main__":
    asyncio.run(seed_user()) 