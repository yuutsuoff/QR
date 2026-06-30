from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models, schemas, utils, uuid, datetime, qrcode
import qrcode.image.svg
from database import get_db
from deps import get_current_admin, get_current_user

router = APIRouter()

def generate_secure_token():
    return uuid.uuid4().hex + uuid.uuid4().hex

def attach_qr_image(qr_token_obj):
    # Generate QR as SVG String
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
        image_factory=qrcode.image.svg.SvgPathImage # Generates a string based SVG
    )
    qr.add_data(qr_token_obj.token)
    qr.make(fit=True)
    
    # Get SVG as string
    svg_img = qr.make_image()
    # Save to memory stream to get string
    import io
    stream = io.BytesIO()
    svg_img.save(stream)
    qr_token_obj.qr_svg = stream.getvalue().decode()
    return qr_token_obj

async def create_daily_token(db: AsyncSession, office_id: str):
    print(f"Generating QR token for office: {office_id}")
    # Deactivate older tokens for this office
    result = await db.execute(select(models.QRToken).filter(models.QRToken.office_id == office_id, models.QRToken.is_active == True))
    active_tokens = result.scalars().all()
    for t in active_tokens:
        t.is_active = False
    
    # Create new
    today = datetime.date.today()
    new_token = models.QRToken(
        token=generate_secure_token(),
        office_id=office_id,
        date=today,
        valid_from=datetime.time(0, 0, 0),   # 00:00 (Always valid on the day)
        valid_to=datetime.time(23, 59, 59), # 23:59 (Always valid on the day)
        is_active=True
    )
    db.add(new_token)
    try:
        await db.commit()
        await db.refresh(new_token)
        print(f"Token created successfully: {new_token.token}")
    except Exception as e:
        await db.rollback()
        print(f"Error creating token: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return attach_qr_image(new_token)

@router.post("/generate", response_model=schemas.QRTokenResponse)
async def generate_qr(
    office_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_admin: models.User = Depends(get_current_admin)
):
    """Admin endpoint to manually generate/regenerate today's token for an office"""
    # Verify office exists
    off_res = await db.execute(select(models.Office).filter(models.Office.id == office_id))
    if not off_res.scalars().first():
        raise HTTPException(status_code=404, detail="Office not found")
        
    return await create_daily_token(db, office_id)

@router.get("/today/{office_id}", response_model=schemas.QRTokenResponse)
async def get_todays_qr(
    office_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    result = await db.execute(
        select(models.QRToken).filter(
            models.QRToken.office_id == office_id,
            models.QRToken.date == datetime.date.today(),
            models.QRToken.is_active == True
        )
    )
    token = result.scalars().first()
    if not token:
        # Auto-generate if missing for today? 
        print(f"No active token found for office {office_id}, auto-generating...")
        # Check office exists
        off_res = await db.execute(select(models.Office).filter(models.Office.id == office_id))
        if not off_res.scalars().first():
             raise HTTPException(status_code=404, detail="Office not found")
        return await create_daily_token(db, office_id)
        
    return attach_qr_image(token)
