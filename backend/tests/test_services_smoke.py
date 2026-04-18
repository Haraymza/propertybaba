from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.schemas.auth import RegisterRequest
from app.services.auth_service import register_user
from app.services.super_admin_service import approve_user


@pytest.mark.asyncio
async def test_register_user_creates_pending_invite_only_user() -> None:
    users_collection = SimpleNamespace(
        find_one=AsyncMock(side_effect=[None, None]),
        insert_one=AsyncMock(return_value=SimpleNamespace(inserted_id="new-user-id")),
    )
    db = SimpleNamespace(users=users_collection)

    payload = RegisterRequest(name="Jane Doe", phone="+12025550111", email="jane@example.com", password="pass1234")
    created = await register_user(db, payload)

    assert created["is_approved"] is False
    assert created["organization_id"] is None
    assert created["role"] == "manager"
    users_collection.insert_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_approve_user_requires_assigned_organization() -> None:
    users_collection = SimpleNamespace(
        find_one=AsyncMock(
            return_value={
                "_id": "660000000000000000000001",
                "organization_id": None,
                "is_approved": False,
                "created_at": datetime.now(timezone.utc),
            }
        ),
        update_one=AsyncMock(),
    )
    db = SimpleNamespace(users=users_collection)

    with pytest.raises(HTTPException) as exc:
        await approve_user(db, "660000000000000000000001")
    assert exc.value.status_code == 400
    users_collection.update_one.assert_not_awaited()
