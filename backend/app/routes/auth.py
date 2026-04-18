from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.security.deps import require_approved_user
from app.services.auth_service import login_user, refresh_tokens, register_user, revoke_refresh_token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> UserResponse:
    user = await register_user(db, payload)
    return UserResponse(**user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> TokenResponse:
    access, refresh = await login_user(db, payload.phone, payload.password)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> TokenResponse:
    access, refresh_token = await refresh_tokens(db, payload.refresh_token)
    return TokenResponse(access_token=access, refresh_token=refresh_token)


@router.post("/logout")
async def logout(payload: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> dict:
    await revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(require_approved_user)) -> UserResponse:
    return UserResponse(**current_user)
