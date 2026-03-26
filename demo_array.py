import requests
import zipfile
import os

API_URL = "http://127.0.0.1:8000/api/v1"

def authenticate():
    r = requests.post(f"{API_URL}/login/access-token", data={
        "username": "user@example.com",
        "password": "Password123!"
    })
    token = r.json().get("access_token")

    if not token:
        print("[!] Registering user for demo...")
        requests.post(f"{API_URL}/users/submit", json={
            "email": "user@example.com",
            "password": "Password123!"
        })
        r = requests.post(f"{API_URL}/login/access-token", data={"username": "user@example.com", "password": "Password123!"})
        token = r.json().get("access_token")
    return token

def create_payload():
    os.makedirs("demo_payload", exist_ok=True)
    with open("demo_payload/calculate_pi.py", "w") as f:
        f.write('''\
import os
import time
import random

def run_monte_carlo(iterations):
    inside_circle = 0
    for _ in range(iterations):
        x = random.random()
        y = random.random()
        if x**2 + y**2 <= 1.0:
            inside_circle += 1
    return (inside_circle / iterations) * 4

if __name__ == "__main__":
    array_index = int(os.getenv("HIVE_ARRAY_INDEX", "1"))
    
    print("=========================================")
    print("🚀 HIVE DISTRIBUTED COMPUTE PLATFORM 🚀")
    print("=========================================")
    print(f"Allocated Task Node ID: #{array_index}")
    print(f"Workload: Monte Carlo Pi Estimation")
    print("-----------------------------------------")
    
    # Use the grid array index to guarantee unique randomness across all hardware
    random.seed(array_index * 42)
    
    iterations = 10_000_000
    print(f"-> Processing {iterations:,} intensive stochastic simulations...")
    
    start = time.time()
    estimated_pi = run_monte_carlo(iterations)
    duration = time.time() - start
    
    print("-----------------------------------------")
    print(f"✅ TASK SUCCESS")
    print(f"📊 Estimated Pi:   {estimated_pi:.6f}")
    print(f"⏱️ Compute Time:   {duration:.2f} seconds")
    print("=========================================")
''')

    with zipfile.ZipFile("distributed_compute.zip", "w") as z:
        z.write("demo_payload/calculate_pi.py", "calculate_pi.py")

def main():
    print("1. Authenticating to Hive Grid...")
    token = authenticate()
    headers = {"Authorization": f"Bearer {token}"}

    print("2. Packaging Machine Learning / Mathematical payload...")
    create_payload()

    # The array size determines how many separate parallel containers will be spawned globally!
    ARRAY_SIZE = 50 

    print(f"3. Submitting Slurm Array Job to the cluster (Spawning {ARRAY_SIZE} Nodes)...")
    with open("distributed_compute.zip", "rb") as f:
        files = {"file": f}
        data = {
            "run_command": "python calculate_pi.py",
            "cpu_req": 1,
            "ram_req": 2.0,  # Requesting 2GB RAM per node conceptually
            "array_size": ARRAY_SIZE 
        }
        r = requests.post(f"{API_URL}/jobs", headers=headers, files=files, data=data)

    if r.status_code == 200:
        job = r.json()
        print("\n\n" + "="*50)
        print(f"🎯 MASSIVE DISTRIBUTED JOB SUBMITTED 🎯")
        print("="*50)
        print(f"Parent Tracking ID: {job['id']}")
        print(f"Array Size:         {ARRAY_SIZE} standalone processes")
        print(f"Total Iterations:   {ARRAY_SIZE * 10_000_000:,} computations queued")
        print("\n-> Watch your Desktop Agent UI immediately pull down these tasks and parallel-process them mathematically!")
        print("-> Go to the Web Dashboard 'Jobs' tab to watch the grid sequentially execute all chunks simultaneously.")
    else:
        print(f"[ERROR] Failed to submit: {r.text}")

if __name__ == "__main__":
    main()
