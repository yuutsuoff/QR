import asyncio
import json
from database import SessionLocal
import models
from sqlalchemy import func
from sqlalchemy.future import select

async def get_test_stats():
    async with SessionLocal() as db:
        users_count = (await db.execute(select(func.count(models.User.id)))).scalar()
        offices_count = (await db.execute(select(func.count(models.Office.id)))).scalar()
        att_count = (await db.execute(select(func.count(models.Attendance.id)))).scalar()
        
        stats = {
            "total_users": users_count or 0,
            "total_offices": offices_count or 0,
            "total_attendance": att_count or 0
        }
        print(json.dumps(stats))

if __name__ == "__main__":
    asyncio.run(get_test_stats())
