from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
async def startup_event():
    from app.db.session import engine, Base, SessionLocal
    from app.models import user, job, agent, transaction
    from app import crud, schemas
    from app.scheduler import scheduler as scheduler_logic
    import asyncio
    
    Base.metadata.create_all(bind=engine)
    
    # Create system user for agents if not exists (ID must be 1)
    db = SessionLocal()
    try:
        system_user = crud.crud_user.get_by_email(db, email="system@hive.io")
        if not system_user:
            user_in = schemas.UserCreate(
                email="system@hive.io",
                password="systempassword_do_not_use",
                is_active=True,
                is_superuser=True
            )
            crud.crud_user.create(db, obj_in=user_in)
    finally:
        db.close()

    # Start Scheduler Loop
    async def run_scheduler():
        while True:
            try:
                # Use a new DB session per iteration
                db_sched = SessionLocal()
                try:
                    scheduler_logic.schedule_jobs(db_sched)
                finally:
                    db_sched.close()
            except Exception as e:
                print(f"Scheduler Error: {e}")
            await asyncio.sleep(5)

    asyncio.create_task(run_scheduler())

@app.get("/")
def root():
    return {"message": "Welcome to Hive API"}

app.include_router(api_router, prefix=settings.API_V1_STR)
