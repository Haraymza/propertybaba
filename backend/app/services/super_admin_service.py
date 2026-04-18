from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_organization(
    db: AsyncIOMotorDatabase,
    name: str,
    description: str | None,
    created_by: ObjectId,
    owner_user_id: str | None = None,
) -> dict:
    existing = await db.organizations.find_one({"name": name})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization name already exists")

    now = datetime.now(timezone.utc)
    org_doc = {
        "name": name,
        "description": description,
        "created_by": created_by,
        "created_at": now,
        "commission_defaults": {"org_percent": 10.0, "agent_percent": 2.0},
    }
    result = await db.organizations.insert_one(org_doc)
    org_doc["_id"] = result.inserted_id

    if owner_user_id:
        owner_obj_id = ObjectId(owner_user_id)
        owner = await db.users.find_one({"_id": owner_obj_id})
        if not owner:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner user not found")
        await db.users.update_one(
            {"_id": owner_obj_id},
            {"$set": {"organization_id": result.inserted_id, "is_approved": True, "role": "admin", "admin_flag": True}},
        )

    return org_doc


async def list_pending_users(db: AsyncIOMotorDatabase) -> list[dict]:
    cursor = db.users.find({"is_approved": False}).sort("created_at", -1)
    return await cursor.to_list(length=200)


async def assign_user_to_organization(db: AsyncIOMotorDatabase, user_id: str, org_id: str) -> None:
    user_obj_id = ObjectId(user_id)
    org_obj_id = ObjectId(org_id)
    user = await db.users.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    org = await db.organizations.find_one({"_id": org_obj_id})
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    await db.users.update_one({"_id": user_obj_id}, {"$set": {"organization_id": org_obj_id}})


async def approve_user(db: AsyncIOMotorDatabase, user_id: str) -> None:
    user_obj_id = ObjectId(user_id)
    user = await db.users.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.get("organization_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assign organization before approval")

    await db.users.update_one({"_id": user_obj_id}, {"$set": {"is_approved": True}})
