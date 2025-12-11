import time
import requests
import psutil
import config
import os
import sys

def get_sys_stats():
    cpu = psutil.cpu_percent()
    ram = psutil.virtual_memory().used / (1024**3)
    return cpu, ram

def main():
    print(f"Starting agent {config.AGENT_NAME}...")
    print(f"Connecting to {config.API_URL}...")
    
    agent_id = None
    
    # 1. Register
    reg_data = {
        "name": config.AGENT_NAME,
        "cpu_cores": psutil.cpu_count(),
        "ram_gb": psutil.virtual_memory().total / (1024**3),
        "status": "idle"
    }
    
    while agent_id is None:
        try:
            print("Attempting to register...")
            resp = requests.post(f"{config.API_URL}/agents/", json=reg_data)
            if resp.status_code == 200 or resp.status_code == 201:
                agent = resp.json()
                agent_id = agent['id']
                print(f"Registered successfully! Agent ID: {agent_id}")
            else:
                print(f"Registration failed: {resp.status_code} - {resp.text}")
                time.sleep(5)
        except Exception as e:
            print(f"Connection error during registration: {e}")
            time.sleep(5)
            
    # Main Loop
    while True:
        try:
            # Heartbeat
            cpu, ram = get_sys_stats()
            # print(f"Sending heartbeat... CPU: {cpu}% RAM: {ram:.2f}GB")
            resp = requests.post(f"{config.API_URL}/agents/{agent_id}/heartbeat", json={
                "current_cpu_usage": cpu,
                "current_ram_usage": ram,
                "status": "idle"
            })
            if resp.status_code != 200:
                print(f"Heartbeat failed: {resp.status_code} - {resp.text}")
            
            # Check for jobs
            resp = requests.get(f"{config.API_URL}/jobs/", params={"agent_id": agent_id, "status": "running"})
            if resp.status_code == 200:
                jobs = resp.json()
                if jobs:
                    for job in jobs:
                        print(f"Received job {job['id']}")
                        try:
                            # 1. Download
                            zip_path = f"job_{job['id']}.zip"
                            print(f"Downloading job {job['id']}...")
                            with requests.get(f"{config.API_URL}/jobs/{job['id']}/download", stream=True) as r:
                                r.raise_for_status()
                                with open(zip_path, 'wb') as f:
                                    for chunk in r.iter_content(chunk_size=8192):
                                        f.write(chunk)
                                        
                            # 2. Run
                            from docker_runner import run_job
                            print(f"Executing job {job['id']}...")
                            status, logs = run_job(
                                job_id=job['id'],
                                zip_path=zip_path,
                                build_cmd=job.get('build_command', ''),
                                run_cmd=job['run_command'],
                                cpu_limit=job['cpu_req'],
                                ram_limit=job['ram_req']
                            )
                            
                            
                            print(f"Job finished with status: {status}")
                            
                            # 3. Report Logs
                            try:
                                requests.post(f"{config.API_URL}/jobs/{job['id']}/logs", json={"content": logs})
                            except Exception as log_err:
                                print(f"Failed to upload logs: {log_err}")

                            # 4. Update Status
                            final_status = "completed" if status == "success" else "failed"
                            # We might want to send finished_at too
                            requests.put(f"{config.API_URL}/jobs/{job['id']}", json={
                                "status": final_status,
                                "finished_at": time.strftime('%Y-%m-%dT%H:%M:%S')
                            })
                            
                            # Clean up zip
                            if os.path.exists(zip_path):
                                os.remove(zip_path)
                                
                        except Exception as e:
                            print(f"Execution error: {e}")
                            # Try to report failure
                            try:
                                requests.put(f"{config.API_URL}/jobs/{job['id']}", json={"status": "failed"})
                            except:
                                pass

            else:
                print(f"Job fetch failed: {resp.status_code}")
                
        except Exception as e:
            print(f"Loop error: {e}")
        
        time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Stopping agent...")
