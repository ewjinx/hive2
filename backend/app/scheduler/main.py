import asyncio
import time
from app.db.session import SessionLocal
from app.scheduler import scheduler

def run_scheduler_loop():
    while True:
        try:
            db = SessionLocal()
            scheduler.schedule_jobs(db)
            db.close()
        except Exception as e:
            print(f"Scheduler error: {e}")
        time.sleep(5) # Run every 5 seconds

if __name__ == "__main__":
    run_scheduler_loop()
