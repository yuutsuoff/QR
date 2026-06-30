from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select
import datetime
from database import SessionLocal
import models
from routers.qr import create_daily_token

scheduler = AsyncIOScheduler()

async def generate_daily_qrs_job():
    print(f"[{datetime.datetime.now()}] CRON: Generating daily QR tokens...")
    async with SessionLocal() as db:
        result = await db.execute(select(models.Office))
        offices = result.scalars().all()
        for office in offices:
            await create_daily_token(db, office.id)
            print(f"[{datetime.datetime.now()}] CRON: Token generated for {office.name}")

def init_cron():
    # Run at 00:00 every day
    scheduler.add_job(generate_daily_qrs_job, 'cron', hour=0, minute=0)
    # Also run on startup once (optional, depends on if we want fresh token immediately on restart)
    # scheduler.add_job(generate_daily_qrs_job, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=5))
    scheduler.start()
    print("Cron jobs initialized.")
