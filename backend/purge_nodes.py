import sys
sys.path.append('.')
from app.db.session import SessionLocal
from app.models.agent import Agent
from app.models.job import Job

db = SessionLocal()
agents = db.query(Agent).all()
count=0
for a in agents:
    if a.status == 'offline' or not a.token:
        jobs = db.query(Job).filter(Job.agent_id == a.id).all()
        for j in jobs:
            j.agent_id = None
            db.add(j)
        db.delete(a)
        count+=1
db.commit()
print(f'Successfully purged {count} ghost nodes from the PostgreSQL database.')
