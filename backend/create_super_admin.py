from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.security.tokens import hash_password

settings = get_settings()


async def create_super_admin() -> None:
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]

    existing_super_admin = await db.users.find_one({"role": "super_admin"})
    if existing_super_admin:
        print("A global super admin already exists")
        client.close()
        return

    phone = "+10000000000"
    existing = await db.users.find_one({"phone": phone})
    if existing:
        print("Super admin already exists")
        client.close()
        return

    now = datetime.now(timezone.utc)
    await db.users.insert_one(
        {
            "name": "Property Baba Super Admin",
            "phone": phone,
            "email": "admin@propertybaba.local",
            "password_hash": hash_password("admin123"),
            "role": "super_admin",
            "admin_flag": True,
            "is_approved": True,
            "organization_id": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    print("Super admin created with phone +10000000000 and password admin123")
    client.close()


if __name__ == "__main__":
    import asyncio

    asyncio.run(create_super_admin())
