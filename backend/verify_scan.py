import asyncio
from database import SessionLocal
import models
import datetime
import uuid
from sqlalchemy.future import select

async def test_scan():
    async with SessionLocal() as db:
        # 1. Get an admin user to use for auth
        res = await db.execute(select(models.User).filter(models.User.email == "admin@itlive.uz"))
        user = res.scalars().first()
        
        if not user:
            print("Admin user not found")
            return
            
        # 2. Create a QR token for today if not exists
        today = datetime.date.today()
        token_str = str(uuid.uuid4())
        qr_token = models.QRToken(
            token=token_str,
            office_id="OF001",
            date=today,
            valid_from=datetime.time(0, 0),
            valid_to=datetime.time(23, 59),
            is_active=True
        )
        db.add(qr_token)
        await db.commit()
        
        print(f"Created QR Token: {token_str}")
        print("Ready for manual testing via Postman or browser.")

if __name__ == "__main__":
    asyncio.run(test_scan())
