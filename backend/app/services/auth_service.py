from datetime import datetime, timedelta

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User
from app.schemas.auth import UserRegisterRequest


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def register_user(db: Session, data: UserRegisterRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Auto-lookup city, district, lat, lng from postal code using real CSV data
    from app.utils.location_service import lookup_postal_code_csv
    loc = lookup_postal_code_csv(data.postal_code)

    city = data.location_city or loc["city"]
    district = data.location_district or loc["district"]
    lat = data.location_lat if data.location_lat is not None else loc["lat"]
    lng = data.location_lng if data.location_lng is not None else loc["lng"]

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role="CUSTOMER",
        mobile_number=data.mobile_number,
        address_line_1=data.address_line_1,
        address_line_2=data.address_line_2,
        postal_code=data.postal_code,
        location_city=city,
        location_district=district,
        location_lat=lat,
        location_lng=lng,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user




def authenticate_user(db: Session, email: str, password: str) -> User:
    user = (
        db.query(User)
        .filter(User.email == email, User.is_active == True)
        .first()
    )
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
