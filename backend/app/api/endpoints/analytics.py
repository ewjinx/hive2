from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.api import deps
from app.models.job import Job
from app.models.agent import Agent
from app.models.transaction import Transaction
from app.models.user import User

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# Helper functions (shared between endpoints)
# ═══════════════════════════════════════════════════════════════════

def _job_distribution(db: Session) -> dict:
    status_counts = (
        db.query(Job.status, sql_func.count(Job.id))
        .group_by(Job.status)
        .all()
    )
    m = {s: c for s, c in status_counts}
    return {
        "pending": m.get("queued", 0),
        "running": m.get("running", 0),
        "completed": m.get("success", 0),
        "failed": m.get("failed", 0) + m.get("system_error", 0) + m.get("abandoned", 0),
    }


def _credit_totals(db: Session, user_id: int = None) -> dict:
    q_earn = db.query(sql_func.coalesce(sql_func.sum(Transaction.amount), 0)).filter(Transaction.amount > 0)
    q_spend = db.query(sql_func.coalesce(sql_func.sum(sql_func.abs(Transaction.amount)), 0)).filter(Transaction.amount < 0)
    
    if user_id:
        q_earn = q_earn.filter(Transaction.user_id == user_id)
        q_spend = q_spend.filter(Transaction.user_id == user_id)
    
    return {
        "earned": round(float(q_earn.scalar()), 2),
        "spent": round(float(q_spend.scalar()), 2),
    }


def _online_agents(db: Session):
    return db.query(Agent).filter(Agent.status != "offline").all()


def _durations(db: Session, limit: int = 20, user_id: int = None):
    q = db.query(Job).filter(
        Job.status == "success",
        Job.started_at.isnot(None),
        Job.finished_at.isnot(None),
    )
    if user_id:
        q = q.filter(Job.owner_id == user_id)
    
    jobs = q.order_by(Job.finished_at.desc()).limit(limit).all()
    
    points = []
    for j in reversed(jobs):
        delta = (j.finished_at - j.started_at).total_seconds()
        points.append({"time": j.finished_at.strftime("%H:%M"), "avgDuration": round(delta, 1)})
    
    return points or [{"time": "now", "avgDuration": 0}]


def _resources(agents):
    if not agents:
        return [{"time": "now", "cpu": 0, "memory": 0}]
    
    avg_cpu = sum(a.current_cpu_usage or 0 for a in agents) / len(agents)
    total_ram = sum(a.ram_gb or 0 for a in agents)
    used_ram = sum(a.current_ram_usage or 0 for a in agents)
    ram_pct = (used_ram / total_ram * 100) if total_ram > 0 else 0
    
    return [{"time": "now", "cpu": round(avg_cpu, 1), "memory": round(ram_pct, 1)}]


# ═══════════════════════════════════════════════════════════════════
# GET /analytics  (backward-compatible combined response)
# ═══════════════════════════════════════════════════════════════════

@router.get("", response_model=Any)
def get_analytics(db: Session = Depends(deps.get_db)) -> Any:
    """Combined analytics (kept for backward compatibility with the dashboard)."""
    dist = _job_distribution(db)
    agents = _online_agents(db)
    
    return {
        "jobDistribution": dist,
        "durations": _durations(db),
        "resources": _resources(agents),
        "credits": _credit_totals(db),
        "queue": dist["pending"],
        "completed": dist["completed"],
        "agentsOnline": len(agents),
    }


# ═══════════════════════════════════════════════════════════════════
# GET /analytics/summary  →  real counts
# ═══════════════════════════════════════════════════════════════════

@router.get("/summary", response_model=Any)
def get_analytics_summary(db: Session = Depends(deps.get_db)) -> Any:
    """
    Lightweight summary: queue depth, completed count, active agents, credit totals.
    """
    dist = _job_distribution(db)
    agents = _online_agents(db)
    total_jobs = db.query(sql_func.count(Job.id)).scalar()
    
    return {
        "queue": dist["pending"],
        "running": dist["running"],
        "completed": dist["completed"],
        "failed": dist["failed"],
        "totalJobs": total_jobs,
        "agentsOnline": len(agents),
        "agentsTotal": db.query(sql_func.count(Agent.id)).scalar(),
        "credits": _credit_totals(db),
    }


# ═══════════════════════════════════════════════════════════════════
# GET /analytics/history  →  time-series data for charts
# ═══════════════════════════════════════════════════════════════════

def _credit_trend(db: Session, days: int = 14):
    """Get daily credit movements over the last N days as a running balance trend."""
    from datetime import datetime, timedelta
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    rows = (
        db.query(
            sql_func.date(Transaction.timestamp).label("day"),
            sql_func.sum(Transaction.amount).label("net"),
        )
        .filter(Transaction.timestamp >= cutoff)
        .group_by(sql_func.date(Transaction.timestamp))
        .order_by(sql_func.date(Transaction.timestamp))
        .all()
    )
    
    running = 0.0
    points = []
    for day, net in rows:
        running += float(net)
        points.append({
            "time": str(day),
            "balance": round(running, 2),
            "earned": round(float(net), 2) if float(net) > 0 else 0,
            "spent": round(abs(float(net)), 2) if float(net) < 0 else 0,
        })
    
    return points or [{"time": "today", "balance": 0, "earned": 0, "spent": 0}]


def _agent_activity(db: Session):
    """Snapshot of agent statuses from the most recent heartbeat data."""
    from datetime import datetime, timedelta
    
    all_agents = db.query(Agent).all()
    
    now = datetime.utcnow()
    online = 0
    idle = 0
    busy = 0
    offline = 0
    
    for a in all_agents:
        if a.last_heartbeat:
            naive_heartbeat = a.last_heartbeat.replace(tzinfo=None)
            if (now - naive_heartbeat).total_seconds() < 120:
                if a.status == "busy":
                    busy += 1
                else:
                    idle += 1
                online += 1
            else:
                offline += 1
        else:
            offline += 1
    
    return {
        "online": online,
        "idle": idle,
        "busy": busy,
        "offline": offline,
        "total": len(all_agents),
    }


@router.get("/history", response_model=Any)
def get_analytics_history(
    db: Session = Depends(deps.get_db),
    limit: int = 20,
) -> Any:
    """
    Time-series chart data: job durations, cluster resource snapshots,
    credit balance trend, and agent activity breakdown.
    """
    agents = _online_agents(db)
    
    return {
        "jobDistribution": _job_distribution(db),
        "durations": _durations(db, limit=limit),
        "resources": _resources(agents),
        "creditTrend": _credit_trend(db),
        "agentActivity": _agent_activity(db),
    }


# ═══════════════════════════════════════════════════════════════════
# GET /analytics/user/{user_id}  →  per-user stats
# ═══════════════════════════════════════════════════════════════════

@router.get("/user/{user_id}", response_model=Any)
def get_user_analytics(
    user_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Per-user analytics: their job counts, durations, credit movements, and agent fleet.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Job counts for this user
    user_status_counts = (
        db.query(Job.status, sql_func.count(Job.id))
        .filter(Job.owner_id == user_id)
        .group_by(Job.status)
        .all()
    )
    m = {s: c for s, c in user_status_counts}
    
    job_stats = {
        "queued": m.get("queued", 0),
        "running": m.get("running", 0),
        "completed": m.get("success", 0),
        "failed": m.get("failed", 0) + m.get("system_error", 0) + m.get("abandoned", 0),
        "total": sum(c for _, c in user_status_counts),
    }
    
    # Average duration for this user's successful jobs
    avg_dur = (
        db.query(
            sql_func.avg(
                sql_func.extract("epoch", Job.finished_at) - sql_func.extract("epoch", Job.started_at)
            )
        )
        .filter(Job.owner_id == user_id, Job.status == "success", Job.started_at.isnot(None), Job.finished_at.isnot(None))
        .scalar()
    )
    
    # Agent count for this user
    user_agents = db.query(sql_func.count(Agent.id)).filter(Agent.owner_id == user_id).scalar()
    online_agents = db.query(sql_func.count(Agent.id)).filter(Agent.owner_id == user_id, Agent.status != "offline").scalar()
    
    # Total cost spent by this user on jobs
    total_cost = (
        db.query(sql_func.coalesce(sql_func.sum(Job.cost), 0))
        .filter(Job.owner_id == user_id)
        .scalar()
    )
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "balance": round(user.balance, 2),
        },
        "jobs": job_stats,
        "avgDuration": round(float(avg_dur), 1) if avg_dur else 0,
        "credits": _credit_totals(db, user_id=user_id),
        "totalCost": round(float(total_cost), 2),
        "agents": {
            "total": user_agents,
            "online": online_agents,
        },
        "durations": _durations(db, user_id=user_id),
    }
