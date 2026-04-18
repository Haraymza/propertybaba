from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.domain import PropertyCreate, PropertyResponse, PropertyUpdate
from app.security.deps import require_organization
from app.services.domain_service import create_property, delete_property, list_properties, restore_property, update_property

router = APIRouter()


@router.get("/", response_model=list[PropertyResponse])
async def get_properties(
    include_archived: bool = False,
    q: str | None = None,
    status_filter: str | None = None,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await list_properties(db, user, include_archived=include_archived, q=q, status_filter=status_filter)
    return [PropertyResponse(**doc) for doc in docs]


@router.post("/", response_model=PropertyResponse, status_code=201)
async def post_property(payload: PropertyCreate, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await create_property(db, payload.model_dump(), user)
    return PropertyResponse(**doc)


@router.put("/{property_id}", response_model=PropertyResponse)
async def put_property(
    property_id: str,
    payload: PropertyUpdate,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await update_property(db, property_id, payload.model_dump(exclude_unset=True), user)
    return PropertyResponse(**doc)


@router.delete("/{property_id}")
async def remove_property(property_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    await delete_property(db, property_id, user)
    return {"message": "Property archived"}


@router.put("/{property_id}/restore", response_model=PropertyResponse)
async def restore_property_route(
    property_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)
):
    doc = await restore_property(db, property_id, user)
    return PropertyResponse(**doc)
