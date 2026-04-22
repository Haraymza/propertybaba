from datetime import datetime
from typing import Literal

from bson import ObjectId
from pydantic import BaseModel, Field

from app.models.common import PyObjectId


class EntityNote(BaseModel):
    id: PyObjectId = Field(alias="_id")
    text: str
    created_at: datetime
    created_by: PyObjectId | None = None
    created_by_name: str | None = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class EntityNoteCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    phone_number: list[str] = Field(..., min_length=1)
    preference: Literal["buy", "rent"] = "buy"
    size: str = ""
    property_type: str = ""
    requirements: str = ""
    priority: Literal["Low", "Medium", "High"] = "Medium"


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone_number: list[str] | None = None
    preference: Literal["buy", "rent"] | None = None
    size: str | None = None
    property_type: str | None = None
    requirements: str | None = None
    priority: Literal["Low", "Medium", "High"] | None = None
    status: Literal["in_process", "closed"] | None = None


class CustomerResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    phone_number: list[str]
    preference: str
    size: str | None = None
    property_type: str | None = None
    requirements: str | None = None
    priority: str
    status: str
    properties_assigned: int
    organization_id: PyObjectId
    created_by: PyObjectId | None = None
    created_by_name: str | None = None
    updated_by: PyObjectId | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: PyObjectId | None = None
    created_at: datetime
    notes: list[EntityNote] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class PropertyCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    address: str = Field(..., min_length=3)
    price: int = Field(..., gt=0)
    type: Literal["sell", "rent"] = "sell"
    type_of_property: str = "House"
    size: str = ""
    seller_name: str
    seller_phone: list[str] = Field(..., min_length=1)


class PropertyUpdate(BaseModel):
    title: str | None = None
    address: str | None = None
    price: int | None = None
    type: Literal["sell", "rent"] | None = None
    type_of_property: str | None = None
    size: str | None = None
    seller_name: str | None = None
    seller_phone: list[str] | None = None
    status: Literal["available", "assigned", "sold"] | None = None


class PropertyResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    title: str
    address: str
    price: int
    type: str
    type_of_property: str
    size: str
    seller_name: str
    seller_phone: list[str]
    status: str
    assigned_to: PyObjectId | None = None
    organization_id: PyObjectId
    created_by: PyObjectId | None = None
    created_by_name: str | None = None
    updated_by: PyObjectId | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: PyObjectId | None = None
    created_at: datetime
    notes: list[EntityNote] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class FinancialLine(BaseModel):
    deal_price: int = Field(..., gt=0)
    org_revenue_cut: float = Field(..., ge=0)
    user_revenue_cut: float = Field(..., ge=0)


class DealCreate(BaseModel):
    customer_id: str
    property_id: str
    deal_type: Literal["buy", "rent"] = "buy"
    financials: list[FinancialLine] | None = None
    override_commission: bool = False


class DealUpdate(BaseModel):
    status: Literal["in_process", "completed", "cancelled"] | None = None
    financials: list[FinancialLine] | None = None
    override_commission: bool | None = None


class DealResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    customer_id: PyObjectId
    property_id: PyObjectId
    organization_id: PyObjectId
    assigned_by: PyObjectId
    created_by: PyObjectId | None = None
    updated_by: PyObjectId | None = None
    closed_by: PyObjectId | None = None
    deal_type: str
    status: str
    financials: list[FinancialLine]
    override_commission: bool = False
    customer_created_by: PyObjectId | None = None
    property_created_by: PyObjectId | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    deleted_by: PyObjectId | None = None
    date_assigned: datetime
    date_completed: datetime | None = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class DashboardStats(BaseModel):
    total_customers: int
    total_properties: int
    total_deals: int
    active_deals: int
    completed_deals: int
    total_revenue: float
