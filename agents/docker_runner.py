import docker
import os
import zipfile
import shutil
import time
import json
import math

client = docker.from_env()


def _split_test_cases(work_dir: str, env_vars: dict):
    """
    Automatically partition tests/test_inputs.json across array task nodes.
    
    Reads the 'cases' array from tests/test_inputs.json inside the extracted
    work directory, determines which slice belongs to this node based on
    HIVE_ARRAY_INDEX (1-based) and HIVE_ARRAY_SIZE, then overwrites the file
    so the user's script only sees its assigned test cases.
    
    If test_inputs.json doesn't exist or env vars are missing, this is a no-op.
    """
    if not env_vars:
        return
    
    array_index_str = env_vars.get("HIVE_ARRAY_INDEX")
    array_size_str = env_vars.get("HIVE_ARRAY_SIZE")
    
    if not array_index_str or not array_size_str:
        return
    
    array_index = int(array_index_str)   # 1-based
    array_size = int(array_size_str)
    
    # Search for test_inputs.json in common locations
    possible_paths = [
        os.path.join(work_dir, "tests", "test_inputs.json"),
        os.path.join(work_dir, "test_inputs.json"),
    ]
    
    test_file = None
    for path in possible_paths:
        if os.path.exists(path):
            test_file = path
            break
    
    if not test_file:
        return
    
    try:
        with open(test_file, "r") as f:
            data = json.load(f)
        
        cases = data.get("cases", [])
        if not cases:
            return
        
        total_cases = len(cases)
        
        # Chunk-based distribution: divide cases as evenly as possible
        # Node 1 gets indices [0..chunk), Node 2 gets [chunk..2*chunk), etc.
        chunk_size = math.ceil(total_cases / array_size)
        start = (array_index - 1) * chunk_size
        end = min(start + chunk_size, total_cases)
        
        my_cases = cases[start:end]
        
        # Overwrite the file with only this node's cases
        data["cases"] = my_cases
        with open(test_file, "w") as f:
            json.dump(data, f, indent=4)
        
        print(f"[HIVE] Node #{array_index}/{array_size}: assigned {len(my_cases)}/{total_cases} test cases (indices {start}-{end-1})")
        
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"[HIVE] Warning: could not split test cases: {e}")

def run_job(job_id: int, zip_path: str, build_cmd: str, run_cmd: str, cpu_limit: int, ram_limit: float, log_callback=None, env_vars=None):
    """
    Run a simple single-command job in a Docker container.
    Streams logs chunk-by-chunk over a buffered timer if a callback is provided.
    Returns (status, logs) tuple.
    """
    work_dir = f"work/{job_id}"
    os.makedirs(work_dir, exist_ok=True)
    
    logs = []
    
    try:
        # 1. Unzip securely (protect against path traversal & zip bombs)
        MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024  # 500 MB
        total_size = 0
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for info in zip_ref.infolist():
                if info.filename.startswith('/') or '..' in info.filename:
                    raise ValueError(f"Malicious zip payload: invalid path {info.filename}")
                total_size += info.file_size
                if total_size > MAX_UNCOMPRESSED_SIZE:
                    raise ValueError("Malicious zip payload: exceeds 500MB uncompressed limit")
            zip_ref.extractall(work_dir)
        
        # 2. Split test cases across array nodes (no-op for non-array jobs)
        _split_test_cases(work_dir, env_vars)
            
        # 3. Build Image (if Dockerfile exists)
        if not os.path.exists(f"{work_dir}/Dockerfile"):
            with open(f"{work_dir}/Dockerfile", "w") as f:
                f.write("FROM python:3.9-slim\nWORKDIR /app\nCOPY . /app\nRUN pip install -r requirements.txt || true\n")
        
        image, build_logs = client.images.build(path=work_dir, tag=f"job-{job_id}")
        for chunk in build_logs:
            if 'stream' in chunk:
                logs.append(chunk['stream'])
                if log_callback:
                    log_callback(chunk['stream'])
        
        # 3. Run container natively
        mem_limit = f"{int(ram_limit * 1024)}m"
        
        container = client.containers.run(
            f"job-{job_id}",
            command=run_cmd,
            detach=True,
            mem_limit=mem_limit,
            nano_cpus=int(cpu_limit * 1e9),
            network_disabled=True,
            cap_drop=["ALL"],
            security_opt=["no-new-privileges"],
            environment=env_vars or {}
        )
        
        # 4. Stream Logs Live & Enforce Size Limits
        buffer = []
        last_push = time.time()
        MAX_LOG_SIZE = 10 * 1024 * 1024 # 10MB
        total_log_bytes = 0
        
        for line in container.logs(stream=True):
            line_str = line.decode('utf-8')
            total_log_bytes += len(line_str)
            
            if total_log_bytes > MAX_LOG_SIZE:
                err = "\n\n[SYSTEM ERROR] Log output exceeded 10MB hardware limit. Terminating container immediately.\n"
                logs.append(err)
                buffer.append(err)
                if log_callback: log_callback(err)
                container.kill()
                break
                
            logs.append(line_str)
            buffer.append(line_str)
            
            # Fire off buffer every 1.5 seconds or 20 lines to prevent HTTP spam
            if log_callback and (time.time() - last_push > 1.5 or len(buffer) >= 20):
                log_callback("".join(buffer))
                buffer.clear()
                last_push = time.time()
                
        # Push any remaining logs after docker stream closes
        if log_callback and buffer:
            log_callback("".join(buffer))
            
        # 5. Determine Exit Code safely
        result = container.wait(timeout=10)
        exit_code = result.get('StatusCode', 1)
        
        container.remove()
        
        status = "success" if exit_code == 0 else "failed"
        return status, "".join(logs)
        
    except Exception as e:
        err_msg = str(e) + "\n".join(logs)
        if log_callback:
            log_callback(f"\n[SYSTEM ERROR]\n{str(e)}")
        return "system_error", err_msg
    finally:
        # Cleanup
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)


def run_pipeline_job(job_id: int, zip_path: str, steps: list, cpu_limit: int, ram_limit: float, step_callback=None, env_vars=None):
    """
    Run a multi-step pipeline job in a Docker container.
    
    Each step is executed sequentially inside the same container.
    If any step fails (non-zero exit code), the pipeline stops immediately.
    
    Args:
        job_id: The job ID
        zip_path: Path to the uploaded zip file
        steps: List of dicts with 'step_index', 'name', 'command'
        cpu_limit: CPU cores requested
        ram_limit: RAM in GB requested
        step_callback: Optional callback function called after each step with:
                       (step_index, status, log, started_at, finished_at)
                       Used by the agent to report per-step status to the server.
    
    Returns:
        (overall_status, step_results) where step_results is a list of dicts:
        [{"step_index": 0, "name": "Install", "status": "success", "log": "...", 
          "started_at": "...", "finished_at": "..."}, ...]
    """
    work_dir = f"work/{job_id}"
    os.makedirs(work_dir, exist_ok=True)
    
    container = None
    step_results = []
    overall_status = "success"
    
    try:
        # 1. Unzip securely (protect against path traversal & zip bombs)
        MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024  # 500 MB
        total_size = 0
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for info in zip_ref.infolist():
                if info.filename.startswith('/') or '..' in info.filename:
                    raise ValueError(f"Malicious zip payload: invalid path {info.filename}")
                total_size += info.file_size
                if total_size > MAX_UNCOMPRESSED_SIZE:
                    raise ValueError("Malicious zip payload: exceeds 500MB uncompressed limit")
            zip_ref.extractall(work_dir)
        
        # 2. Split test cases across array nodes (no-op for non-array jobs)
        _split_test_cases(work_dir, env_vars)
        
        # 3. Build Docker image
        if not os.path.exists(f"{work_dir}/Dockerfile"):
            with open(f"{work_dir}/Dockerfile", "w") as f:
                f.write("FROM python:3.9-slim\nWORKDIR /app\nCOPY . /app\nRUN pip install -r requirements.txt || true\n")
        
        image, build_logs = client.images.build(path=work_dir, tag=f"job-{job_id}")
        
        # 3. Start container (keep alive with a long-running command)
        mem_limit = f"{int(ram_limit * 1024)}m"
        
        container = client.containers.run(
            f"job-{job_id}",
            command="tail -f /dev/null",  # Keep container alive
            detach=True,
            mem_limit=mem_limit,
            nano_cpus=int(cpu_limit * 1e9),
            network_disabled=True,
            cap_drop=["ALL"],
            security_opt=["no-new-privileges"],
            environment=env_vars or {}
        )
        
        from datetime import datetime, timezone
        
        # 4. Execute each step sequentially
        for step in steps:
            step_index = step['step_index']
            step_name = step['name']
            step_command = step['command']
            
            started_at = datetime.now(timezone.utc).isoformat()
            
            # Notify: step is running
            if step_callback:
                step_callback(step_index, "running", None, started_at, None)
            
            try:
                # Execute the step command inside the container
                exec_result = container.exec_run(
                    cmd=["sh", "-c", step_command],
                    workdir="/app",
                    demux=True
                )
                
                exit_code = exec_result.exit_code
                
                # Collect output (stdout + stderr) & Enforce Size Limits
                stdout = exec_result.output[0].decode('utf-8') if exec_result.output[0] else ""
                stderr = exec_result.output[1].decode('utf-8') if exec_result.output[1] else ""
                
                MAX_LOG_SIZE = 10 * 1024 * 1024 # 10MB
                if len(stdout) + len(stderr) > MAX_LOG_SIZE:
                    stdout = stdout[:MAX_LOG_SIZE]
                    stderr += "\n\n[SYSTEM WARNING] Step output exceeded 10MB hardware limit and was forcefully truncated.\n"

                step_log = stdout
                if stderr:
                    step_log += f"\n[STDERR]\n{stderr}"
                
                finished_at = datetime.now(timezone.utc).isoformat()
                
                if exit_code == 0:
                    step_status = "success"
                else:
                    step_status = "failed"
                    step_log += f"\n[EXIT CODE: {exit_code}]"
                
                result = {
                    "step_index": step_index,
                    "name": step_name,
                    "status": step_status,
                    "log": step_log,
                    "started_at": started_at,
                    "finished_at": finished_at,
                }
                step_results.append(result)
                
                # Report step result
                if step_callback:
                    step_callback(step_index, step_status, step_log, started_at, finished_at)
                
                # Stop pipeline if step failed
                if step_status == "failed":
                    overall_status = "failed"
                    print(f"  Step '{step_name}' failed — stopping pipeline.")
                    
                    # Mark remaining steps as skipped
                    remaining = [s for s in steps if s['step_index'] > step_index]
                    for rem in remaining:
                        skip_result = {
                            "step_index": rem['step_index'],
                            "name": rem['name'],
                            "status": "skipped",
                            "log": "Skipped due to previous step failure",
                            "started_at": None,
                            "finished_at": None,
                        }
                        step_results.append(skip_result)
                        if step_callback:
                            step_callback(rem['step_index'], "skipped", "Skipped due to previous step failure", None, None)
                    
                    break
                    
            except Exception as e:
                finished_at = datetime.now(timezone.utc).isoformat()
                result = {
                    "step_index": step_index,
                    "name": step_name,
                    "status": "failed",
                    "log": f"Execution error: {str(e)}",
                    "started_at": started_at,
                    "finished_at": finished_at,
                }
                step_results.append(result)
                overall_status = "failed"
                
                if step_callback:
                    step_callback(step_index, "failed", f"Execution error: {str(e)}", started_at, finished_at)
                break
        
        return overall_status, step_results
        
    except Exception as e:
        return "system_error", [{"step_index": -1, "name": "setup", "status": "failed", 
                           "log": f"Pipeline setup error: {str(e)}", 
                           "started_at": None, "finished_at": None}]
    finally:
        # Cleanup container
        if container:
            try:
                container.stop(timeout=5)
                container.remove()
            except Exception:
                pass
        # Cleanup work directory
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)
