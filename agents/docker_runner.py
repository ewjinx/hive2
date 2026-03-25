import docker
import os
import zipfile
import shutil
import time

client = docker.from_env()

def run_job(job_id: int, zip_path: str, build_cmd: str, run_cmd: str, cpu_limit: int, ram_limit: float, log_callback=None):
    """
    Run a simple single-command job in a Docker container.
    Streams logs chunk-by-chunk over a buffered timer if a callback is provided.
    Returns (status, logs) tuple.
    """
    work_dir = f"work/{job_id}"
    os.makedirs(work_dir, exist_ok=True)
    
    logs = []
    
    try:
        # 1. Unzip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(work_dir)
            
        # 2. Build Image (if Dockerfile exists)
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
        )
        
        # 4. Stream Logs Live
        buffer = []
        last_push = time.time()
        
        for line in container.logs(stream=True):
            line_str = line.decode('utf-8')
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


def run_pipeline_job(job_id: int, zip_path: str, steps: list, cpu_limit: int, ram_limit: float, step_callback=None):
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
        # 1. Unzip
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(work_dir)
        
        # 2. Build Docker image
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
                
                # Collect output (stdout + stderr)
                stdout = exec_result.output[0].decode('utf-8') if exec_result.output[0] else ""
                stderr = exec_result.output[1].decode('utf-8') if exec_result.output[1] else ""
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
