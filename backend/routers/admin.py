from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from sqlalchemy import func
import datetime

import models
import schemas
from database import get_db
from deps import get_current_admin

router = APIRouter()

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    users_count = (await db.execute(select(func.count(models.User.id)))).scalar()
    offices_count = (await db.execute(select(func.count(models.Office.id)))).scalar()
    
    today = datetime.date.today()
    att_count = (await db.execute(
        select(func.count(models.Attendance.id))
        .where(models.Attendance.date == today)
    )).scalar()
    
    return {
        "total_users": users_count or 0,
        "total_offices": offices_count or 0,
        "total_attendance": att_count or 0
    }

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result_users = await db.execute(select(models.User))
    return result_users.scalars().all()

@router.get("/offices", response_model=List[schemas.OfficeResponse])
async def get_offices(
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result_offices = await db.execute(select(models.Office))
    return result_offices.scalars().all()

@router.get("/attendance", response_model=List[schemas.AttendanceResponse])
async def get_attendance(
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result_att = await db.execute(
        select(models.Attendance, models.User.name)
        .join(models.User, models.Attendance.user_id == models.User.id)
        .order_by(models.Attendance.date.desc())
    )
    records = []
    for row in result_att.all():
        att = row[0]
        user_name = row[1]
        att.user_name = user_name
        records.append(att)
    return records

@router.post("/offices/add", response_model=schemas.OfficeResponse)
async def add_office(
    office: schemas.OfficeCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    new_office = models.Office(id=office.id, name=office.name, location=office.location)
    db.add(new_office)
    await db.commit()
    await db.refresh(new_office)
    return new_office

@router.get("/users/{user_id}/attendance", response_model=List[schemas.AttendanceResponse])
async def get_user_attendance(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result_att = await db.execute(
        select(models.Attendance, models.User.name)
        .join(models.User, models.Attendance.user_id == models.User.id)
        .where(models.Attendance.user_id == user_id)
        .order_by(models.Attendance.date.desc())
    )
    records = []
    for row in result_att.all():
        att = row[0]
        user_name = row[1]
        att.user_name = user_name
        records.append(att)
    return records

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: str,
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.name is not None: user.name = user_update.name
    if user_update.email is not None: user.email = user_update.email
    if user_update.role is not None: user.role = user_update.role
    if user_update.shift_type is not None: user.shift_type = user_update.shift_type
    
    if user_update.password is not None:
        import utils
        user.password = utils.get_password_hash(user_update.password)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}
