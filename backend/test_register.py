import urllib.request, json

data = json.dumps({
    "name": "Super Admin",
    "email": "admin@itlive.uz",
    "password": "Admin1234",
    "role": "admin"
}).encode()

req = urllib.request.Request(
    "http://127.0.0.1:8002/auth/register_admin",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req) as r:
        print("SUCCESS:", r.status, r.read().decode())
except Exception as e:
    print("ERROR:", e)
