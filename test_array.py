import requests
import time
import zipfile
import os

API_URL = "http://127.0.0.1:8000/api/v1"

# 1. Login to get token
r = requests.post(f"{API_URL}/login/access-token", data={
    "username": "user@example.com",
    "password": "Password123!"
})
token = r.json().get("access_token")

# If login failed, register and login
if not token:
    print("User not found. Registering new admin test account...")
    requests.post(f"{API_URL}/users/submit", json={
        "email": "user@example.com",
        "password": "Password123!"
    })
    r = requests.post(f"{API_URL}/login/access-token", data={"username": "user@example.com", "password": "Password123!"})
    token = r.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}

# 2. Create a dummy test zip
os.makedirs("test_payload", exist_ok=True)
with open("test_payload/test_script.py", "w") as f:
    f.write('''
import os
import time

array_index = os.getenv("HIVE_ARRAY_INDEX", "0")
print(f"Running isolated Test Case #{array_index}...")
time.sleep(1) # simulate heavy work
print(f"Test Case #{array_index} Passed.")
''')

with zipfile.ZipFile("test_array.zip", "w") as z:
    z.write("test_payload/test_script.py", "test_script.py")

# 3. Submit Job
print("Submitting Slurm Array Job (size: 200)...")
with open("test_array.zip", "rb") as f:
    files = {"file": f}
    data = {
        "run_command": "python test_script.py",
        "cpu_req": 1,
        "ram_req": 0.5,
        "array_size": 200
    }
    r = requests.post(f"{API_URL}/jobs", headers=headers, files=files, data=data)

if r.status_code == 200:
    job = r.json()
    print(f"Array Submitted Successfully! Parent ID: {job['id']}")
    print("-> Open the Desktop App to see your nodes ramp up!")
    print("-> Open the Web Dashboard. You'll see 200 jobs queued, mapped to Best-Fit nodes instantly.")
else:
    print(f"Failed to submit: {r.text}")
