from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    await _create_indexes()


async def close_mongo_connection() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database is not initialized.")
    return db


async def _create_indexes() -> None:
    database = get_db()
    await database.users.create_index("phone", unique=True)
    await database.users.create_index("email", unique=True, sparse=True)
    await database.users.create_index("organization_id")
    await database.users.create_index("is_approved")
    await database.users.create_index(
        "role",
        unique=True,
        partialFilterExpression={"role": "super_admin"},
        name="single_global_super_admin_role_unique",
    )

    await database.organizations.create_index("name", unique=True)
    await database.organizations.create_index("created_by")

    await database.customers.create_index("organization_id")
    await database.customers.create_index("status")
    await database.customers.create_index("is_deleted")
    await database.properties.create_index("organization_id")
    await database.properties.create_index("status")
    await database.properties.create_index("is_deleted")
    await database.deals.create_index("organization_id")
    await database.deals.create_index("status")
    await database.deals.create_index("customer_id")
    await database.deals.create_index("property_id")
    await database.deals.create_index("is_deleted")

    await database.refresh_tokens.create_index("jti", unique=True)
    await database.refresh_tokens.create_index("user_id")
    await database.refresh_tokens.create_index("expires_at")
