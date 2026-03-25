from fastapi import APIRouter

from app.api.endpoints import auth, users, agents, jobs, analytics

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
