from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.schemas.domain import CustomerCreate, CustomerResponse, CustomerUpdate
from app.security.deps import require_organization
from app.services.domain_service import create_customer, delete_customer, list_customers, restore_customer, update_customer

router = APIRouter()


@router.get("/", response_model=list[CustomerResponse])
async def get_customers(
    include_archived: bool = False,
    q: str | None = None,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await list_customers(db, user, include_archived=include_archived, q=q)
    return [CustomerResponse(**doc) for doc in docs]


@router.post("/", response_model=CustomerResponse, status_code=201)
async def post_customer(payload: CustomerCreate, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await create_customer(db, payload.model_dump(), user)
    return CustomerResponse(**doc)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def put_customer(
    customer_id: str,
    payload: CustomerUpdate,
    user: dict = Depends(require_organization),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await update_customer(db, customer_id, payload.model_dump(exclude_unset=True), user)
    return CustomerResponse(**doc)


@router.delete("/{customer_id}")
async def remove_customer(customer_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)):
    await delete_customer(db, customer_id, user)
    return {"message": "Customer archived"}


@router.put("/{customer_id}/restore", response_model=CustomerResponse)
async def restore_customer_route(
    customer_id: str, user: dict = Depends(require_organization), db: AsyncIOMotorDatabase = Depends(get_db)
):
    doc = await restore_customer(db, customer_id, user)
    return CustomerResponse(**doc)
