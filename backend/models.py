import uuid
from sqlalchemy import Column, String, Boolean, Date, Time, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID # Fallback mapping if using postgres
from database import Base
import datetime

# Helper for uuid string if SQLite doesn't natively support uuid objects easily
def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, default="employee") # Admin, employee
    shift_type = Column(String, default="full_day") # full_day, morning_shift, afternoon_shift
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Office(Base):
    __tablename__ = "offices"

    id = Column(String, primary_key=True, index=True) # e.g. OF001
    name = Column(String, index=True)
    location = Column(String)

class QRToken(Base):
    __tablename__ = "qr_tokens"

    token = Column(String, primary_key=True, index=True)
    office_id = Column(String, ForeignKey("offices.id"))
    date = Column(Date, index=True)
    valid_from = Column(Time)
    valid_to = Column(Time)
    is_active = Column(Boolean, default=True)

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(Date, index=True)
    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)
    status = Column(String, default="present") # present, late, etc.
