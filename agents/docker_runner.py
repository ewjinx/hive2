import docker
import os
import zipfile
import shutil
import time

client = docker.from_env()

def run_job(job_id: int, zip_path: str, build_cmd: str, run_cmd: str, cpu_limit: int, ram_limit: float):
    work_dir = f"work/{job_id}"
    os.makedirs(work_dir, exist_ok=True)
    
    logs = []
    
    try:
        # 1. Unzip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(work_dir)
            
        # 2. Build Image (if Dockerfile exists)
        # If no Dockerfile, use a Python base image? 
        # For this demo, assume Dockerfile exists or auto-generate
        if not os.path.exists(f"{work_dir}/Dockerfile"):
            with open(f"{work_dir}/Dockerfile", "w") as f:
                f.write("FROM python:3.9-slim\nWORKDIR /app\nCOPY . /app\nRUN pip install -r requirements.txt || true\n")
        
        image, build_logs = client.images.build(path=work_dir, tag=f"job-{job_id}")
        for chunk in build_logs:
            if 'stream' in chunk:
                logs.append(chunk['stream'])
        
        # 3. Run
        # Convert RAM GB to Bytes
        mem_limit = f"{int(ram_limit * 1024)}m"
        
        container = client.containers.run(
            f"job-{job_id}",
            command=run_cmd, # Or use entrypoint
            detach=True,
            mem_limit=mem_limit,
            # cpu_quota=... # Docker SDK uses different params for CPU
        )
        
        container.wait(timeout=600) # 10 min timeout
        log_output = container.logs().decode('utf-8')
        logs.append(log_output)
        
        container.remove()
        
        return "success", "".join(logs)
        
    except Exception as e:
        return "failed", str(e) + "\n".join(logs)
    finally:
        # Cleanup
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)
