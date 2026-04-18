from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.database import get_db
from app.schemas.domain import DealCreate, DealUpdate
from app.security.deps import require_organization
from app.services.domain_service import create_deal, delete_deal, list_deals, restore_deal, update_deal

router = APIRouter()


def _serialize_bson(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_serialize_bson(v) for v in value]
    if isinstance(value, dict):
        return {k: _serialize_bson(v) for k, v in value.items()}
    return value


@router.get("/")
async def get_deals(
    include_archived: bool = False,
    q: str | None = None,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    data = await list_deals(db, user, include_archived=include_archived, q=q)
    return _serialize_bson(data)


@router.post("/", status_code=201)
async def post_deal(payload: DealCreate, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    data = await create_deal(db, payload.model_dump(), user)
    return _serialize_bson(data)


@router.put("/{deal_id}")
async def put_deal(
    deal_id: str,
    payload: DealUpdate,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    data = await update_deal(db, deal_id, payload.model_dump(exclude_unset=True), user)
    return _serialize_bson(data)


@router.delete("/{deal_id}")
async def remove_deal(deal_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    await delete_deal(db, deal_id, user)
    return {"message": "Deal archived"}


@router.put("/{deal_id}/restore")
async def restore_deal_route(
    deal_id: str,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    data = await restore_deal(db, deal_id, user)
    return _serialize_bson(data)
