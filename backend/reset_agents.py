import sys
sys.path.append('.')
from app.db.session import SessionLocal
from app.models.agent import Agent

db = SessionLocal()
agents = db.query(Agent).all()
for a in agents:
    a.current_cpu_usage = 0.0
    a.current_ram_usage = 0.0
    db.add(a)

db.commit()
print("Successfully forced a DB-level zero-out on all Agent computing metric locks.")
