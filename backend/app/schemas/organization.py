from datetime import datetime

from bson import ObjectId
from pydantic import BaseModel, Field

from app.models.common import PyObjectId


class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: str | None = None
    owner_user_id: str | None = None


class OrganizationResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    description: str | None = None
    created_by: PyObjectId
    commission_defaults: dict | None = None
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }
