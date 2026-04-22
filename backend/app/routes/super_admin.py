from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.organization import OrganizationCreateRequest, OrganizationResponse
from app.schemas.user import PendingUsersResponse, SuperAdminCreateUserRequest, UserResponse, UserUpdateRequest
from app.security.deps import require_super_admin
from app.security.tokens import hash_password
from app.services.super_admin_service import (
    approve_user,
    assign_user_to_organization,
    create_organization,
    list_pending_users,
)

router = APIRouter()


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user_by_super_admin(
    payload: SuperAdminCreateUserRequest,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserResponse:
    if payload.role not in {"manager", "admin"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if not ObjectId.is_valid(payload.organization_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization id")

    org = await db.organizations.find_one({"_id": ObjectId(payload.organization_id)})
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

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
        "is_approved": payload.is_approved,
        "organization_id": ObjectId(payload.organization_id),
        "created_at": now,
        "updated_at": now,
    }
    if email:
        new_user["email"] = email

    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return UserResponse(**new_user)


@router.post("/organizations", response_model=OrganizationResponse, status_code=201)
async def create_organization_endpoint(
    payload: OrganizationCreateRequest,
    current_user: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> OrganizationResponse:
    org = await create_organization(
        db=db,
        name=payload.name,
        description=payload.description,
        created_by=current_user["_id"],
        owner_user_id=payload.owner_user_id,
    )
    return OrganizationResponse(**org)


@router.get("/organizations", response_model=list[OrganizationResponse])
async def list_organizations(
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[OrganizationResponse]:
    docs = await db.organizations.find().sort("created_at", -1).to_list(length=200)
    return [OrganizationResponse(**doc) for doc in docs]


@router.get("/users/pending", response_model=PendingUsersResponse)
async def get_pending_users(
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> PendingUsersResponse:
    users = await list_pending_users(db)
    return PendingUsersResponse(users=[UserResponse(**u) for u in users])


@router.post("/users/{user_id}/assign-organization")
async def assign_org(
    user_id: str,
    organization_id: str,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    await assign_user_to_organization(db, user_id, organization_id)
    return {"message": "User assigned to organization"}


@router.post("/users/{user_id}/approve")
async def approve(
    user_id: str,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    await approve_user(db, user_id)
    return {"message": "User approved"}


@router.get("/organizations/{org_id}/users", response_model=list[UserResponse])
async def list_organization_users(
    org_id: str,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> list[UserResponse]:
    org = await db.organizations.find_one({"_id": ObjectId(org_id)})
    if not org:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    docs = await db.users.find({"organization_id": ObjectId(org_id)}).sort("created_at", -1).to_list(length=300)
    return [UserResponse(**doc) for doc in docs]


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    admin_flag: bool = False,
    is_approved: bool = True,
    organization_id: str | None = None,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    if role not in ("manager", "admin"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    update_data = {"role": role, "admin_flag": admin_flag, "is_approved": is_approved}
    if organization_id:
        if not ObjectId.is_valid(organization_id):
            from fastapi import HTTPException, status

            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization id")
        update_data["organization_id"] = ObjectId(organization_id)

    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    if result.matched_count == 0:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "User role updated"}


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_details(
    user_id: str,
    payload: UserUpdateRequest,
    _: dict = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserResponse:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")
    existing = await db.users.find_one({"_id": ObjectId(user_id)})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates: dict = {}
    unset_fields: dict = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.phone is not None:
        dupe_phone = await db.users.find_one({"phone": payload.phone, "_id": {"$ne": ObjectId(user_id)}})
        if dupe_phone:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already in use")
        updates["phone"] = payload.phone
    if payload.email is not None:
        email = payload.email.strip().lower()
        if email:
            dupe_email = await db.users.find_one({"email": email, "_id": {"$ne": ObjectId(user_id)}})
            if dupe_email:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use")
            updates["email"] = email
        else:
            unset_fields["email"] = ""
    if payload.password:
        updates["password_hash"] = hash_password(payload.password)
    if payload.role is not None:
        if payload.role not in ("manager", "admin", "super_admin"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
        updates["role"] = payload.role
        updates["admin_flag"] = payload.role in {"admin", "super_admin"}
    if payload.admin_flag is not None and payload.role is None:
        updates["admin_flag"] = payload.admin_flag
    if payload.is_approved is not None:
        updates["is_approved"] = payload.is_approved
    if payload.organization_id is not None:
        if payload.organization_id == "":
            updates["organization_id"] = None
        else:
            if not ObjectId.is_valid(payload.organization_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization id")
            updates["organization_id"] = ObjectId(payload.organization_id)
    updates["updated_at"] = datetime.now(timezone.utc)

    if updates or unset_fields:
        update_doc: dict = {}
        if updates:
            update_doc["$set"] = updates
        if unset_fields:
            update_doc["$unset"] = unset_fields
        await db.users.update_one({"_id": ObjectId(user_id)}, update_doc)
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    return UserResponse(**updated)


@router.post("/bootstrap/super-admin")
async def bootstrap_super_admin(
    name: str,
    phone: str,
    password_hash: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    existing_super_admin = await db.users.find_one({"role": "super_admin"})
    if existing_super_admin:
        return {"message": "Super admin already exists", "user_id": str(existing_super_admin["_id"])}

    existing = await db.users.find_one({"phone": phone})
    if existing:
        return {"message": "Super admin already exists", "user_id": str(existing["_id"])}

    doc = {
        "name": name,
        "phone": phone,
        "password_hash": password_hash,
        "role": "super_admin",
        "admin_flag": True,
        "is_approved": True,
        "organization_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    return {"message": "Super admin created", "user_id": str(result.inserted_id)}
