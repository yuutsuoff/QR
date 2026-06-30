import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"

def test_qr_generation():
    # 1. Login to get token
    login_data = urllib.parse.urlencode({
        "username": "admin@itlive.uz",
        "password": "Admin1234"
    }).encode()
    
    print(f"Logging in as admin@itlive.uz...")
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_data, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            response_data = json.loads(res.read().decode())
            token = response_data["access_token"]
            print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get offices
    req = urllib.request.Request(f"{BASE_URL}/admin/offices", headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as res:
            offices = json.loads(res.read().decode())
            if not offices:
                print("No offices found.")
                return
            office_id = offices[0]["id"]
            print(f"Testing QR generation for office: {office_id}")
    except Exception as e:
        print(f"Failed to get offices: {e}")
        return

    # 3. Generate QR
    # Dashboard.jsx uses api.post(`/qr/generate?office_id=${office.id}`)
    # Since it's a POST with no body, we might need to handle it carefully.
    url = f"{BASE_URL}/qr/generate?office_id={office_id}"
    req = urllib.request.Request(url, headers=headers, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            print(f"Generate QR response: {res.status if hasattr(res, 'status') else res.getcode()}")
            print(res.read().decode())
    except Exception as e:
        if hasattr(e, 'read'):
            print(f"Generate QR failed: {e.code} {e.read().decode()}")
        else:
            print(f"Generate QR failed: {e}")

if __name__ == "__main__":
    test_qr_generation()
