from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    id: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "employee"
    shift_type: str = "full_day" # full_day, morning_shift, afternoon_shift

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    shift_type: Optional[str] = None
    password: Optional[str] = None

# --- Office Schemas ---
class OfficeBase(BaseModel):
    id: str
    name: str
    location: Optional[str] = None

class OfficeCreate(OfficeBase):
    pass

class OfficeResponse(OfficeBase):
    class Config:
        from_attributes = True

# --- QR Token Schemas ---
class QRTokenBase(BaseModel):
    office_id: str
    date: datetime.date
    valid_from: datetime.time
    valid_to: datetime.time
    is_active: bool = True

class QRTokenCreate(QRTokenBase):
    pass

class QRTokenResponse(QRTokenBase):
    token: str
    qr_svg: Optional[str] = None

    class Config:
        from_attributes = True

class QRVerifyData(BaseModel):
    token: str

class ScanQRResponse(BaseModel):
    status: str
    action: str # check_in or check_out
    message: str
    time: str
    user_name: str

# --- Attendance Schemas ---
class AttendanceBase(BaseModel):
    date: datetime.date
    check_in: Optional[datetime.time] = None
    check_out: Optional[datetime.time] = None
    status: str

class AttendanceResponse(AttendanceBase):
    id: str
    user_id: str
    user_name: Optional[str] = None

    class Config:
        from_attributes = True
