from datetime import datetime

from bson import ObjectId
from pydantic import BaseModel, Field

from app.models.common import PyObjectId


class UserResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    phone: str
    email: str | None = None
    role: str
    admin_flag: bool
    is_approved: bool
    organization_id: PyObjectId | None = None
    created_at: datetime

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str},
    }


class PendingUsersResponse(BaseModel):
    users: list[UserResponse]


class AdminCreateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    email: str | None = None
    password: str = Field(..., min_length=6)
    role: str = "manager"


class UserUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    phone: str | None = Field(None, min_length=7, max_length=20)
    email: str | None = None
    password: str | None = Field(None, min_length=6)
    role: str | None = None
    admin_flag: bool | None = None
    is_approved: bool | None = None
    organization_id: str | None = None
