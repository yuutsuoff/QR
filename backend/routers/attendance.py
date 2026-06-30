from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import models, schemas, datetime
from database import get_db
from deps import get_current_user

router = APIRouter()

@router.post("/check-in", response_model=schemas.AttendanceResponse)
async def check_in(
    data: schemas.QRVerifyData,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verify token
    today = datetime.date.today()
    now_time = datetime.datetime.now().time()
    
    result = await db.execute(
        select(models.QRToken).filter(
            models.QRToken.token == data.token,
            models.QRToken.is_active == True,
            models.QRToken.date == today
        )
    )
    qr_token = result.scalars().first()
    
    if not qr_token:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")
        
    if now_time < qr_token.valid_from or now_time > qr_token.valid_to:
        raise HTTPException(status_code=400, detail="QR token is not valid at this time")
        
    # 2. Check if already checked in today
    att_result = await db.execute(
        select(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date == today
        )
    )
    attendance = att_result.scalars().first()
    
    if attendance:
        if attendance.check_in is not None:
            raise HTTPException(status_code=400, detail="Already checked in today")
            
    # 3. Create check-in
    now = datetime.datetime.now()
    new_att = models.Attendance(
        user_id=current_user.id,
        date=today,
        check_in=now.time(),
        status="present" # Could determine 'late' based on valid_from + buffer
    )
    db.add(new_att)
    await db.commit()
    await db.refresh(new_att)
    return new_att

@router.post("/check-out", response_model=schemas.AttendanceResponse)
async def check_out(
    data: schemas.QRVerifyData,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify token
    today = datetime.date.today()
    
    result = await db.execute(
        select(models.QRToken).filter(
            models.QRToken.token == data.token,
            models.QRToken.is_active == True,
            models.QRToken.date == today
        )
    )
    qr_token = result.scalars().first()
    
    if not qr_token:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")
        
    # Find today's attendance
    att_result = await db.execute(
        select(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date == today
        )
    )
    attendance = att_result.scalars().first()
    
    if not attendance or not attendance.check_in:
        raise HTTPException(status_code=400, detail="Cannot check out without checking in")
        
    if attendance.check_out:
        raise HTTPException(status_code=400, detail="Already checked out today")
        
    attendance.check_out = datetime.datetime.now().time()
    await db.commit()
    await db.refresh(attendance)
    return attendance

@router.get("/month", response_model=list[schemas.AttendanceResponse])
async def get_month_attendance(
    month: int = None, 
    year: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = datetime.date.today()
    if not month:
        month = today.month
    if not year:
        year = today.year
        
    result = await db.execute(
        select(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            func.extract('month', models.Attendance.date) == month,
            func.extract('year', models.Attendance.date) == year
        ).order_by(models.Attendance.date.desc())
    )
    return result.scalars().all()

@router.post("/scan-qr", response_model=schemas.ScanQRResponse)
async def scan_qr(
    data: schemas.QRVerifyData,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Verify token
    today = datetime.date.today()
    now_time = datetime.datetime.now().time()
    
    result = await db.execute(
        select(models.QRToken).filter(
            models.QRToken.token == data.token,
            models.QRToken.is_active == True,
            models.QRToken.date == today
        )
    )
    qr_token = result.scalars().first()
    
    if not qr_token:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")
        
    # 2. Check today's attendance
    att_result = await db.execute(
        select(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date == today
        )
    )
    attendance = att_result.scalars().first()
    
    action = ""
    message = ""
    now_str = datetime.datetime.now().strftime("%H:%M:%S")
    
    if not attendance:
        # Perform Check-in
        action = "check_in"
        status_label = "present"
        
        # Check if late based on shift
        # Default full_day: 08:30
        shift_start = datetime.time(8, 30)
        if current_user.shift_type == "afternoon_shift":
            shift_start = datetime.time(12, 0)
        elif current_user.shift_type == "morning_shift":
            shift_start = datetime.time(8, 30)
            
        # If more than 15 minutes late, mark as late
        shift_dt = datetime.datetime.combine(today, shift_start)
        now_dt = datetime.datetime.now()
        if now_dt > (shift_dt + datetime.timedelta(minutes=15)):
            status_label = "late"
            
        new_att = models.Attendance(
            user_id=current_user.id,
            date=today,
            check_in=now_time,
            status=status_label
        )
        db.add(new_att)
        message = f"Xush kelibsiz, {current_user.name}! Kirish vaqti: {now_str} ({status_label})"
    elif attendance.check_out is None:
        # Perform Check-out
        action = "check_out"
        attendance.check_out = now_time
        message = f"Xayr, {current_user.name}! Chiqish vaqti: {now_str}"
    else:
        # Already checked out
        return schemas.ScanQRResponse(
            status="error",
            action="none",
            message="Bugun uchun allaqachon chiqish qayd etilgan!",
            time=now_str,
            user_name=current_user.name
        )
        
    await db.commit()
    return schemas.ScanQRResponse(
        status="success",
        action=action,
        message=message,
        time=now_str,
        user_name=current_user.name
    )
