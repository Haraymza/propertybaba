from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.domain import DashboardStats
from app.security.deps import require_organization
from app.services.domain_service import dashboard_stats

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard(user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    data = await dashboard_stats(db, user)
    return DashboardStats(**data)


@router.get("/context")
async def get_dashboard_context(user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    org = await db.organizations.find_one({"_id": user["organization_id"]}, {"name": 1})
    return {"organization_name": (org or {}).get("name")}
