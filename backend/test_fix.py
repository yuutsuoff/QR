import asyncio
from database import SessionLocal
import models
import utils

async def fix_and_test():
    async with SessionLocal() as db:
        # 1. Reset admin password to something known
        new_hash = utils.get_password_hash("admin123")
        from sqlalchemy.future import select
        result = await db.execute(select(models.User).filter(models.User.email == "admin@itlive.uz"))
        admin = result.scalars().first()
        if admin:
            admin.password = new_hash
            print("Admin password reset to 'admin123'")
        
        # 2. Try to add a test office to verify DB writability
        test_office = models.Office(id="TEST001", name="Test Office", location="Test Location")
        db.add(test_office)
        try:
            await db.commit()
            print("Successfully added TEST001 office.")
        except Exception as e:
            await db.rollback()
            print(f"Failed to add office: {e}")
            
    # Verification print
    async with SessionLocal() as db:
        res = await db.execute(select(models.Office))
        offices = res.scalars().all()
        print(f"Total offices in DB now: {len(offices)}")
        for o in offices:
            print(f"- {o.name} ({o.id})")

if __name__ == "__main__":
    asyncio.run(fix_and_test())
