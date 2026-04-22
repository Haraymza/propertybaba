from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.user import AdminCreateUserRequest, UserResponse, UserUpdateRequest
from app.security.deps import require_organization
from app.security.tokens import hash_password
from app.services.domain_service import agent_deal_breakdown, agent_revenue_report

router = APIRouter()


def require_admin_scope(user: dict) -> None:
    if not user.get("admin_flag") and user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


@router.get("/users", response_model=list[UserResponse])
async def list_users(user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_scope(user)
    docs = await db.users.find({"organization_id": user["organization_id"]}).sort("created_at", -1).to_list(length=200)
    return [UserResponse(**doc) for doc in docs]


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_team_user(
    payload: AdminCreateUserRequest,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_admin_scope(user)

    existing_phone = await db.users.find_one({"phone": payload.phone})
    if existing_phone:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already in use")

    email = payload.email.strip().lower() if payload.email else None
    if email:
        existing_email = await db.users.find_one({"email": email})
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")

    now = datetime.now(timezone.utc)
    new_user = {
        "name": payload.name,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "admin_flag": payload.role == "admin",
        "is_approved": True,
        "organization_id": user["organization_id"],
        "created_at": now,
        "updated_at": now,
    }
    if email:
        new_user["email"] = email
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return UserResponse(**new_user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_org_user(
    user_id: str,
    payload: UserUpdateRequest,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_admin_scope(user)
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id), "organization_id": user["organization_id"]})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in organization")

    updates: dict = {}
    unset_fields: dict = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.phone is not None:
        existing_phone = await db.users.find_one({"phone": payload.phone, "_id": {"$ne": ObjectId(user_id)}})
        if existing_phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already in use")
        updates["phone"] = payload.phone
    if payload.email is not None:
        email = payload.email.strip().lower()
        if email:
            existing_email = await db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
            if existing_email:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
            updates["email"] = email
        else:
            unset_fields["email"] = ""
    if payload.password:
        updates["password_hash"] = hash_password(payload.password)
    if payload.role is not None:
        if payload.role not in {"admin", "manager"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        updates["role"] = payload.role
        updates["admin_flag"] = payload.role == "admin"
    if payload.is_approved is not None:
        updates["is_approved"] = payload.is_approved
    updates["updated_at"] = datetime.now(timezone.utc)

    if not updates and not unset_fields:
        return UserResponse(**target)
    update_doc: dict = {}
    if updates:
        update_doc["$set"] = updates
    if unset_fields:
        update_doc["$unset"] = unset_fields
    await db.users.update_one({"_id": ObjectId(user_id)}, update_doc)
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserResponse(**updated)


@router.put("/users/{user_id}/activate")
async def activate_user(user_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_scope(user)
    await db.users.update_one(
        {"_id": ObjectId(user_id), "organization_id": user["organization_id"]},
        {"$set": {"is_approved": True}},
    )
    return {"message": "User activated"}


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_scope(user)
    await db.users.update_one(
        {"_id": ObjectId(user_id), "organization_id": user["organization_id"]},
        {"$set": {"is_approved": False}},
    )
    return {"message": "User deactivated"}


@router.get("/organization/commission-defaults")
async def get_commission_defaults(user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    require_admin_scope(user)
    org = await db.organizations.find_one({"_id": user["organization_id"]}, {"commission_defaults": 1})
    stored = (org or {}).get("commission_defaults") or {}
    return {
        "org_percent": float(stored.get("org_percent", 10.0)),
        "agent_percent": float(stored.get("agent_percent", 2.0)),
    }


@router.put("/organization/commission-defaults")
async def update_commission_defaults(
    org_percent: float,
    agent_percent: float,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_admin_scope(user)
    if org_percent < 0 or agent_percent < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Commission percents must be non-negative")
    defaults = {"org_percent": org_percent, "agent_percent": agent_percent}
    await db.organizations.update_one({"_id": user["organization_id"]}, {"$set": {"commission_defaults": defaults}})
    return {"message": "Commission defaults updated", "commission_defaults": defaults}


@router.get("/revenue/agents")
async def get_agent_revenue(
    window: str = "all",
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_admin_scope(user)
    if window not in {"all", "month"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="window must be one of: all, month")
    return await agent_revenue_report(db, user, window=window)


@router.get("/revenue/agents/{agent_id}/deals")
async def get_agent_revenue_deals(
    agent_id: str,
    window: str = "all",
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    require_admin_scope(user)
    if window not in {"all", "month"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="window must be one of: all, month")
    return await agent_deal_breakdown(db, user, agent_id=agent_id, window=window)
