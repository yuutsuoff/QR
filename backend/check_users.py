import asyncio
from database import SessionLocal
from sqlalchemy.future import select
import models

async def check():
    async with SessionLocal() as db:
        r = await db.execute(select(models.User))
        users = r.scalars().all()
        if not users:
            print("Bazada hech qanday foydalanuvchi yo'q!")
        for u in users:
            print(f"Name: {u.name}  |  Email: {u.email}  |  Role: {u.role}")
        print(f"\nJami: {len(users)} ta foydalanuvchi")

asyncio.run(check())
