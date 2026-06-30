import asyncio
from database import SessionLocal
import models
import utils
from sqlalchemy.future import select

async def verify_admin():
    async with SessionLocal() as db:
        emails = ["admin@itlive.uz", "admiin@gmail.com"]
        for email in emails:
            result = await db.execute(select(models.User).filter(models.User.email == email))
            user = result.scalars().first()
            if user:
                print(f"Resetting {email} to admin123")
                user.password = utils.get_password_hash("admin123")
                await db.commit()
            else:
                print(f"User {email} not found.")

if __name__ == "__main__":
    asyncio.run(verify_admin())
