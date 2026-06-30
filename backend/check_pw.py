import asyncio
import models
import utils
from database import SessionLocal
from sqlalchemy.future import select

async def check_pw():
    async with SessionLocal() as db:
        result = await db.execute(select(models.User).filter(models.User.email == "admin@itlive.uz"))
        user = result.scalars().first()
        if not user:
            print("User not found")
            return
        
        passwords = ["Admin1234", "admin123", "admin"]
        for pw in passwords:
            if utils.verify_password(pw, user.password):
                print(f"MATCH FOUND: {pw}")
                return
        print("No match found for known common passwords.")

if __name__ == "__main__":
    asyncio.run(check_pw())
