from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.auth import RegisterRequest
from app.security.tokens import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


async def register_user(db: AsyncIOMotorDatabase, payload: RegisterRequest) -> dict:
    email = payload.email.strip().lower() if payload.email else None
    existing_phone = await db.users.find_one({"phone": payload.phone})
    if existing_phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already in use")

    if email:
        existing_email = await db.users.find_one({"email": email})
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    now = datetime.now(timezone.utc)
    new_user = {
        "name": payload.name,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": "manager",
        "admin_flag": False,
        "is_approved": False,
        "organization_id": None,
        "created_at": now,
        "updated_at": now,
    }
    if email:
        new_user["email"] = email
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return new_user


async def login_user(db: AsyncIOMotorDatabase, phone: str, password: str) -> tuple[str, str]:
    user = await db.users.find_one({"phone": phone})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.get("is_approved"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending approval")

    access = create_access_token(
        user_id=str(user["_id"]),
        role=user["role"],
        admin_flag=user["admin_flag"],
        organization_id=str(user["organization_id"]) if user.get("organization_id") else None,
    )
    refresh, jti, expires_at = create_refresh_token(str(user["_id"]))
    await db.refresh_tokens.insert_one(
        {
            "jti": jti,
            "user_id": user["_id"],
            "expires_at": expires_at,
            "revoked": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return access, refresh


async def refresh_tokens(db: AsyncIOMotorDatabase, refresh_token: str) -> tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token type")

    jti = payload.get("jti")
    sub = payload.get("sub")
    if not jti or not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed refresh token")

    token_doc = await db.refresh_tokens.find_one({"jti": jti, "revoked": False})
    if not token_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or missing")

    expires_at = token_doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = await db.users.find_one({"_id": ObjectId(sub)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    await db.refresh_tokens.update_one({"_id": token_doc["_id"]}, {"$set": {"revoked": True}})

    access = create_access_token(
        user_id=str(user["_id"]),
        role=user["role"],
        admin_flag=user["admin_flag"],
        organization_id=str(user["organization_id"]) if user.get("organization_id") else None,
    )
    new_refresh, new_jti, expires_at = create_refresh_token(str(user["_id"]))
    await db.refresh_tokens.insert_one(
        {
            "jti": new_jti,
            "user_id": user["_id"],
            "expires_at": expires_at,
            "revoked": False,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return access, new_refresh


async def revoke_refresh_token(db: AsyncIOMotorDatabase, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token)
        jti = payload.get("jti")
        if jti:
            await db.refresh_tokens.update_one({"jti": jti}, {"$set": {"revoked": True}})
    except ValueError:
        # Ignore invalid token during logout.
        return
