from typing import Optional

from fastapi import APIRouter, Depends, Request, Response, HTTPException, status, Cookie
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

_COOKIE_MAX_AGE = settings.refresh_token_expire_days * 24 * 60 * 60


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=False,      # Set True in production with HTTPS
        samesite="lax",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(
    request: Request,
    response: Response,
    data: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    user = register_user(db, data)
    access_token = create_access_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        branch_id=user.branch_id,
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(
    request: Request,
    response: Response,
    data: UserLoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, data.email, data.password)
    access_token = create_access_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        branch_id=user.branch_id,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie not found — please log in again",
        )

    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    new_access = create_access_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    new_refresh = create_refresh_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    _set_refresh_cookie(response, new_refresh)

    return TokenResponse(
        access_token=new_access,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        branch_id=user.branch_id,
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
