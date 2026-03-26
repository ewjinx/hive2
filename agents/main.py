import time
import requests
import psutil
import config
import os
import threading
from datetime import datetime, timezone
import docker_runner

class NodeManager:
    def __init__(self):
        self.stop_event = threading.Event()
        self.threads = {}
        self.agent_stop_events = {}
        self.statuses = {}
        
    def get_sys_stats(self):
        return psutil.cpu_percent(), psutil.virtual_memory().used / (1024**3)
        
    def start(self):
        self.stop_event.clear()
        self.manager_thread = threading.Thread(target=self._manage_loop, daemon=True)
        self.manager_thread.start()
        
    def stop(self):
        self.stop_event.set()
        for ev in self.agent_stop_events.values():
            ev.set()
            
    def is_any_running(self):
        return any("Running" in str(status) for status in self.statuses.values())
        
    def _manage_loop(self):
        while not self.stop_event.is_set():
            config.load_config()
            active_ids = []
            
            for agent in config.AGENTS:
                aid = agent.get("id")
                active_ids.append(aid)
                
                if agent.get("status") != "offline":
                    if aid not in self.threads or not self.threads[aid].is_alive():
                        ev = threading.Event()
                        self.agent_stop_events[aid] = ev
                        t = threading.Thread(target=self._agent_loop, args=(agent, ev), daemon=True)
                        self.threads[aid] = t
                        t.start()
                else:
                    if aid in self.threads:
                        self.agent_stop_events[aid].set()
                        
            to_del = []
            for aid, t in self.threads.items():
                if not t.is_alive() or aid not in active_ids:
                    if aid in self.agent_stop_events:
                        self.agent_stop_events[aid].set()
                    to_del.append(aid)
                    
            for aid in to_del:
                del self.threads[aid]
                if aid in self.agent_stop_events:
                    del self.agent_stop_events[aid]
                if aid in self.statuses:
                    del self.statuses[aid]
                    
            time.sleep(2)
            
    def _agent_loop(self, agent_config, stop_ev):
        aid = agent_config["id"]
        token = agent_config.get("token", "")
        headers = {"X-Agent-Token": str(token)} if token else {}
        
        active_jobs = set()
        
        while not stop_ev.is_set():
            try:
                self.statuses[aid] = "Idle" if not active_jobs else f"Running {len(active_jobs)} Job(s)"
                cpu, ram = self.get_sys_stats()
                
                resp = requests.post(
                    f"{config.API_URL}/agents/{aid}/heartbeat", 
                    json={"current_cpu_usage": cpu, "current_ram_usage": ram, "status": "busy" if active_jobs else "idle"}, 
                    headers=headers, timeout=5
                )
                
                resp = requests.get(
                    f"{config.API_URL}/jobs", 
                    params={"agent_id": aid, "status": "running"}, 
                    headers=headers, timeout=5
                )
                
                if resp.status_code == 200:
                    jobs = resp.json()
                    for job in jobs:
                        if stop_ev.is_set():
                            break
                        
                        job_id = job['id']
                        if job_id not in active_jobs:
                            active_jobs.add(job_id)
                            self.statuses[aid] = f"Running Job {job_id}"
                            
                            def bg_runner(j, a, h):
                                try:
                                    self._execute_job(j, a, h)
                                finally:
                                    if j['id'] in active_jobs:
                                        active_jobs.remove(j['id'])
                            
                            threading.Thread(target=bg_runner, args=(job, aid, headers), daemon=True).start()
                        
            except Exception as e:
                self.statuses[aid] = f"Error: {str(e)}"
                
            for _ in range(10):
                if stop_ev.is_set():
                    break
                time.sleep(0.5)

    def _execute_job(self, job, aid, headers):
        job_id = job['id']
        zip_path = f"job_{job_id}.zip"
        try:
            with requests.get(f"{config.API_URL}/jobs/{job_id}/download", stream=True, headers=headers) as r:
                if r.status_code == 200:
                    with open(zip_path, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                else:
                    print(f"Failed to download zip: {r.status_code}")
                    return

            pipeline_steps = job.get('pipeline_steps', [])
            if pipeline_steps:
                status, _ = self._execute_pipeline_job(job, zip_path, pipeline_steps, headers, job.get('env_vars'))
            else:
                def live_log_chunk(chunk):
                    try:
                        r = requests.post(f"{config.API_URL}/jobs/{job_id}/logs", json={"content": chunk}, headers=headers)
                        if r.status_code >= 400:
                            print(f"Log upload failed: {r.text}")
                    except:
                        pass
                
                status, _ = docker_runner.run_job(
                    job_id=job_id,
                    zip_path=zip_path,
                    build_cmd=job.get('build_command', ''),
                    run_cmd=job['run_command'],
                    cpu_limit=job['cpu_req'],
                    ram_limit=job['ram_req'],
                    log_callback=live_log_chunk,
                    env_vars=job.get('env_vars')
                )
            
            final_status = status if status in ["success", "system_error"] else "failed"
            requests.put(f"{config.API_URL}/jobs/{job_id}", json={
                "status": final_status,
                "finished_at": datetime.now(timezone.utc).isoformat()
            }, headers=headers)
            
        except Exception as e:
            print(f"Error executing job {job_id}: {e}")
            requests.put(f"{config.API_URL}/jobs/{job_id}", json={"status": "system_error"}, headers=headers)
        finally:
            if os.path.exists(zip_path):
                os.remove(zip_path)

    def _execute_pipeline_job(self, job, zip_path, pipeline_steps, headers, env_vars=None):
        job_id = job['id']
        steps = sorted(
            [{"step_index": s['step_index'], "name": s['name'], "command": s['command']} for s in pipeline_steps],
            key=lambda x: x['step_index']
        )
        
        def step_callback(step_index, status, log, started_at, finished_at):
            update_data = {"status": status}
            if log is not None: update_data["log"] = log
            if started_at is not None: update_data["started_at"] = started_at
            if finished_at is not None: update_data["finished_at"] = finished_at
            try:
                requests.put(f"{config.API_URL}/jobs/{job_id}/steps/{step_index}", json=update_data, headers=headers)
            except Exception as e:
                print(f"Step update failed: {e}")
        
        overall_status, step_results = docker_runner.run_pipeline_job(
            job_id=job_id,
            zip_path=zip_path,
            steps=steps,
            cpu_limit=job['cpu_req'],
            ram_limit=job['ram_req'],
            step_callback=step_callback,
            env_vars=env_vars
        )
        
        combined_log = []
        for result in step_results:
            combined_log.append(f"=== Step: {result['name']} ({result['status']}) ===")
            if result.get('log'):
                combined_log.append(result['log'])
            combined_log.append("")
        
        try:
            requests.post(f"{config.API_URL}/jobs/{job_id}/logs", json={"content": "\n".join(combined_log)}, headers=headers)
        except:
            pass
            
        return overall_status, step_results

# Initialize global manager
manager = NodeManager()
