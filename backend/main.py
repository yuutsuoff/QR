from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import engine, Base, get_db
import models
from routers import auth, qr, attendance, admin
from cron import init_cron
import contextlib
import os
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from limiter import limiter

load_dotenv()

templates = Jinja2Templates(directory="templates")

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # init db
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # For dev only
        await conn.run_sync(Base.metadata.create_all)
    
    # init cron
    init_cron()
    
    yield
    # clean up on shutdown

app = FastAPI(title="ITLive QR Attendance API", lifespan=lifespan, debug=True)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 1. Trusted Host Middleware
allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost 127.0.0.1").split()
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=allowed_hosts
)

# 2. Custom Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# 3. Refined CORS configuration
cors_origins_raw = os.getenv("CORS_ORIGINS", "*")
if cors_origins_raw == "*":
    cors_origins = ["*"]
else:
    cors_origins = cors_origins_raw.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(qr.router, prefix="/qr", tags=["QR Services"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Panel"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to ITLive QR Attendance API.",
        "docs": "Go to /docs for Swagger UI",
        "react_dashboard": "Go to http://localhost:5173 for the Modern React Dashboard",
        "legacy_dashboard": "Go to /admin-ui for the Legacy Jinja2 Dashboard"
    }

@app.get("/admin-ui")
async def admin_ui(request: Request, db: AsyncSession = Depends(get_db)):
    result_users = await db.execute(select(models.User))
    users = result_users.scalars().all()
    
    result_offices = await db.execute(select(models.Office))
    offices = result_offices.scalars().all()
    
    result_att = await db.execute(select(models.Attendance))
    attendance_records = result_att.scalars().all()
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "users": users,
        "offices": offices,
        "attendance": attendance_records
    })
