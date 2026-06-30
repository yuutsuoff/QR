from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm
import utils, models, schemas
from database import get_db
from deps import get_current_admin
from limiter import limiter

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).filter(models.User.email == form_data.username))
    user = result.scalars().first()
    
    print(f"DEBUG LOGIN: Trying to login with {form_data.username}")
    if user:
        print(f"DEBUG LOGIN: Found user {user.email}")
        match = utils.verify_password(form_data.password, user.password)
        print(f"DEBUG LOGIN: Password match? {match}")
    else:
        print(f"DEBUG LOGIN: User NOT found in DB")

    if not user or not utils.verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = utils.timedelta(minutes=utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"email": user.email, "role": user.role, "id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# For creating first admin (only works if no users exist)
@router.post("/register_admin", response_model=schemas.UserResponse)
async def register_admin(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    if users:
        raise HTTPException(status_code=400, detail="Admin or users already exist. Registration closed.")
    
    hashed_password = utils.get_password_hash(user.password)
    db_user = models.User(
        name=user.name, 
        email=user.email, 
        password=hashed_password, 
        role="admin"
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# Check if any users exist (for setup page detection)
@router.get("/setup-needed")
async def setup_needed(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    return {"setup_needed": len(users) == 0}

# Admin adds employees (protected — only admin can do this)
@router.post("/register_user", response_model=schemas.UserResponse)
async def register_user(
    user: schemas.UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin)
):
    # Check if email already exists
    result = await db.execute(select(models.User).filter(models.User.email == user.email))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan.")
    
    hashed_password = utils.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role if user.role in ["admin", "employee"] else "employee",
        shift_type=user.shift_type
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
