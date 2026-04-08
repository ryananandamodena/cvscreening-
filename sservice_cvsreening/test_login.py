import requests
import json

def test_login(url, email, password):
    print(f"Testing login at {url} with {email}...")
    try:
        response = requests.post(
            url,
            json={"email": email, "password": password},
            timeout=10
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

# Test Service directly
test_login("http://localhost:8081/api/login", "admin@test.com", "Password123!")
# Test Gateway
test_login("http://localhost:8080/api/login", "admin@test.com", "Password123!")
# Test with wrong credentials (should be 401)
test_login("http://localhost:8080/api/login", "wrong@test.com", "wrong")
