from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase


def _oid(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid object id")
    return ObjectId(value)


def _assert_manager_or_admin(user: dict) -> None:
    role = str(user.get("role") or "").lower()
    if user.get("admin_flag") or role in {"manager", "admin", "super_admin"}:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager or admin required")


def _assert_admin(user: dict) -> None:
    role = str(user.get("role") or "").lower()
    if user.get("admin_flag") or role in {"admin", "super_admin"}:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin required")


async def create_customer(db: AsyncIOMotorDatabase, payload: dict, user: dict) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        **payload,
        "status": "in_process",
        "properties_assigned": 0,
        "organization_id": user["organization_id"],
        "created_by": user["_id"],
        "updated_by": user["_id"],
        "is_deleted": False,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": now,
        "notes": [],
    }
    result = await db.customers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def list_customers(db: AsyncIOMotorDatabase, user: dict, include_archived: bool = False, q: str | None = None) -> list[dict]:
    filters: dict = {"organization_id": user["organization_id"]}
    if not include_archived:
        filters["is_deleted"] = {"$ne": True}
    if q:
        filters["name"] = {"$regex": q, "$options": "i"}
    cursor = db.customers.find(filters).sort("created_at", -1)
    customers = await cursor.to_list(length=300)
    creator_ids = [doc.get("created_by") for doc in customers if doc.get("created_by")]
    creator_map: dict[ObjectId, str] = {}
    if creator_ids:
        user_docs = await db.users.find({"_id": {"$in": list(set(creator_ids))}}, {"name": 1}).to_list(length=300)
        creator_map = {u["_id"]: u.get("name", "Unknown") for u in user_docs}
    for doc in customers:
        creator_id = doc.get("created_by")
        doc["created_by_name"] = creator_map.get(creator_id) if creator_id else None
    return customers


async def update_customer(db: AsyncIOMotorDatabase, customer_id: str, payload: dict, user: dict) -> dict:
    existing = await db.customers.find_one(
        {"_id": _oid(customer_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    payload["updated_by"] = user["_id"]
    await db.customers.update_one({"_id": existing["_id"]}, {"$set": payload})
    return await db.customers.find_one({"_id": existing["_id"]})


async def add_customer_note(db: AsyncIOMotorDatabase, customer_id: str, text: str, user: dict) -> dict:
    _assert_manager_or_admin(user)
    existing = await db.customers.find_one(
        {"_id": _oid(customer_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    note = {
        "_id": ObjectId(),
        "text": text.strip(),
        "created_at": datetime.now(timezone.utc),
        "created_by": user.get("_id"),
        "created_by_name": user.get("name"),
    }
    await db.customers.update_one({"_id": existing["_id"]}, {"$push": {"notes": note}, "$set": {"updated_by": user["_id"]}})
    return note


async def delete_customer_note(db: AsyncIOMotorDatabase, customer_id: str, note_id: str, user: dict) -> None:
    _assert_admin(user)
    existing = await db.customers.find_one(
        {"_id": _oid(customer_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    result = await db.customers.update_one(
        {"_id": existing["_id"]},
        {"$pull": {"notes": {"_id": _oid(note_id)}}, "$set": {"updated_by": user["_id"]}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


async def delete_customer(db: AsyncIOMotorDatabase, customer_id: str, user: dict) -> None:
    customer_obj_id = _oid(customer_id)
    deals_count = await db.deals.count_documents({"customer_id": customer_obj_id, "status": "in_process"})
    if deals_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer has active deals")
    result = await db.customers.update_one(
        {"_id": customer_obj_id, "organization_id": user["organization_id"]},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc), "deleted_by": user["_id"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")


async def create_property(db: AsyncIOMotorDatabase, payload: dict, user: dict) -> dict:
    now = datetime.now(timezone.utc)
    doc = {
        **payload,
        "status": "available",
        "assigned_to": None,
        "organization_id": user["organization_id"],
        "created_by": user["_id"],
        "updated_by": user["_id"],
        "is_deleted": False,
        "deleted_at": None,
        "deleted_by": None,
        "created_at": now,
        "notes": [],
    }
    result = await db.properties.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def list_properties(
    db: AsyncIOMotorDatabase, user: dict, include_archived: bool = False, q: str | None = None, status_filter: str | None = None
) -> list[dict]:
    filters: dict = {"organization_id": user["organization_id"]}
    if not include_archived:
        filters["is_deleted"] = {"$ne": True}
    if q:
        filters["title"] = {"$regex": q, "$options": "i"}
    if status_filter:
        filters["status"] = status_filter
    cursor = db.properties.find(filters).sort("created_at", -1)
    properties = await cursor.to_list(length=300)
    creator_ids = [doc.get("created_by") for doc in properties if doc.get("created_by")]
    creator_map: dict[ObjectId, str] = {}
    if creator_ids:
        user_docs = await db.users.find({"_id": {"$in": list(set(creator_ids))}}, {"name": 1}).to_list(length=300)
        creator_map = {u["_id"]: u.get("name", "Unknown") for u in user_docs}
    for doc in properties:
        creator_id = doc.get("created_by")
        doc["created_by_name"] = creator_map.get(creator_id) if creator_id else None
    return properties


async def update_property(db: AsyncIOMotorDatabase, property_id: str, payload: dict, user: dict) -> dict:
    existing = await db.properties.find_one(
        {"_id": _oid(property_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    payload["updated_by"] = user["_id"]
    await db.properties.update_one({"_id": existing["_id"]}, {"$set": payload})
    return await db.properties.find_one({"_id": existing["_id"]})


async def add_property_note(db: AsyncIOMotorDatabase, property_id: str, text: str, user: dict) -> dict:
    _assert_manager_or_admin(user)
    existing = await db.properties.find_one(
        {"_id": _oid(property_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    note = {
        "_id": ObjectId(),
        "text": text.strip(),
        "created_at": datetime.now(timezone.utc),
        "created_by": user.get("_id"),
        "created_by_name": user.get("name"),
    }
    await db.properties.update_one({"_id": existing["_id"]}, {"$push": {"notes": note}, "$set": {"updated_by": user["_id"]}})
    return note


async def delete_property_note(db: AsyncIOMotorDatabase, property_id: str, note_id: str, user: dict) -> None:
    _assert_admin(user)
    existing = await db.properties.find_one(
        {"_id": _oid(property_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    result = await db.properties.update_one(
        {"_id": existing["_id"]},
        {"$pull": {"notes": {"_id": _oid(note_id)}}, "$set": {"updated_by": user["_id"]}},
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


async def delete_property(db: AsyncIOMotorDatabase, property_id: str, user: dict) -> None:
    property_obj_id = _oid(property_id)
    deals_count = await db.deals.count_documents({"property_id": property_obj_id, "status": "in_process"})
    if deals_count > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Property has active deals")
    result = await db.properties.update_one(
        {"_id": property_obj_id, "organization_id": user["organization_id"]},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc), "deleted_by": user["_id"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")


def _compute_financials(deal_price: int, defaults: dict) -> list[dict]:
    org_percent = float(defaults.get("org_percent", 10.0))
    agent_percent = float(defaults.get("agent_percent", 2.0))
    org_revenue_cut = round((deal_price * org_percent) / 100, 2)
    return [
        {
            "deal_price": deal_price,
            "org_revenue_cut": org_revenue_cut,
            "user_revenue_cut": round((deal_price * agent_percent) / 100, 2),
        }
    ]


async def create_deal(db: AsyncIOMotorDatabase, payload: dict, user: dict) -> dict:
    customer_id = _oid(payload["customer_id"])
    property_id = _oid(payload["property_id"])
    customer = await db.customers.find_one(
        {"_id": customer_id, "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    prop = await db.properties.find_one(
        {"_id": property_id, "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    if prop.get("status") != "available":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Property is not available")

    org = await db.organizations.find_one({"_id": user["organization_id"]}) or {}
    org_defaults = org.get("commission_defaults", {"org_percent": 10.0, "agent_percent": 2.0})
    payload_financials = payload.get("financials") or []
    if payload.get("override_commission") and payload_financials:
        financials = payload_financials
    else:
        base_price = int(payload_financials[0]["deal_price"]) if payload_financials else int(prop.get("price", 0))
        financials = _compute_financials(base_price, org_defaults)

    now = datetime.now(timezone.utc)
    doc = {
        "customer_id": customer_id,
        "property_id": property_id,
        "organization_id": user["organization_id"],
        "assigned_by": user["_id"],
        "created_by": user["_id"],
        "updated_by": user["_id"],
        "closed_by": None,
        "deal_type": payload["deal_type"],
        "status": "in_process",
        "financials": financials,
        "override_commission": bool(payload.get("override_commission")),
        "customer_created_by": customer.get("created_by"),
        "property_created_by": prop.get("created_by"),
        "is_deleted": False,
        "deleted_at": None,
        "deleted_by": None,
        "date_assigned": now,
        "date_completed": None,
    }
    result = await db.deals.insert_one(doc)
    doc["_id"] = result.inserted_id

    await db.properties.update_one({"_id": property_id}, {"$set": {"status": "assigned", "assigned_to": customer_id}})
    await db.customers.update_one({"_id": customer_id}, {"$inc": {"properties_assigned": 1}})
    return doc


async def list_deals(db: AsyncIOMotorDatabase, user: dict, include_archived: bool = False, q: str | None = None) -> list[dict]:
    filters: dict = {"organization_id": user["organization_id"]}
    if not include_archived:
        filters["is_deleted"] = {"$ne": True}
    if q:
        filters["deal_type"] = {"$regex": q, "$options": "i"}
    cursor = db.deals.find(filters).sort("date_assigned", -1)
    deals = await cursor.to_list(length=300)
    for d in deals:
        d["customer"] = await db.customers.find_one({"_id": d["customer_id"]}, {"name": 1, "phone_number": 1})
        d["property"] = await db.properties.find_one({"_id": d["property_id"]}, {"title": 1, "address": 1, "price": 1})
        d["created_by_user"] = await db.users.find_one({"_id": d.get("created_by")}, {"name": 1, "phone": 1})
        d["customer_creator"] = await db.users.find_one({"_id": d.get("customer_created_by")}, {"name": 1, "phone": 1})
        d["property_creator"] = await db.users.find_one({"_id": d.get("property_created_by")}, {"name": 1, "phone": 1})
    return deals


async def update_deal(db: AsyncIOMotorDatabase, deal_id: str, payload: dict, user: dict) -> dict:
    existing = await db.deals.find_one(
        {"_id": _oid(deal_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}}
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    update_doc = {**payload}
    update_doc["updated_by"] = user["_id"]
    if payload.get("status") == "completed":
        update_doc["date_completed"] = datetime.now(timezone.utc)
        update_doc["closed_by"] = user["_id"]
    await db.deals.update_one({"_id": existing["_id"]}, {"$set": update_doc})
    updated = await db.deals.find_one({"_id": existing["_id"]})

    if payload.get("status") == "completed" and existing.get("status") != "completed":
        await db.properties.update_one({"_id": existing["property_id"]}, {"$set": {"status": "sold", "assigned_to": None}})
        await db.customers.update_one({"_id": existing["customer_id"]}, {"$inc": {"properties_assigned": -1}})
    elif payload.get("status") == "cancelled":
        await db.properties.update_one({"_id": existing["property_id"]}, {"$set": {"status": "available", "assigned_to": None}})
        await db.customers.update_one({"_id": existing["customer_id"]}, {"$inc": {"properties_assigned": -1}})
    return updated


async def delete_deal(db: AsyncIOMotorDatabase, deal_id: str, user: dict) -> None:
    existing = await db.deals.find_one({"_id": _oid(deal_id), "organization_id": user["organization_id"], "is_deleted": {"$ne": True}})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    await db.deals.update_one(
        {"_id": existing["_id"]},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc), "deleted_by": user["_id"]}},
    )


async def restore_customer(db: AsyncIOMotorDatabase, customer_id: str, user: dict) -> dict:
    obj_id = _oid(customer_id)
    result = await db.customers.update_one(
        {"_id": obj_id, "organization_id": user["organization_id"], "is_deleted": True},
        {"$set": {"is_deleted": False, "deleted_at": None, "deleted_by": None, "updated_by": user["_id"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archived customer not found")
    return await db.customers.find_one({"_id": obj_id})


async def restore_property(db: AsyncIOMotorDatabase, property_id: str, user: dict) -> dict:
    obj_id = _oid(property_id)
    result = await db.properties.update_one(
        {"_id": obj_id, "organization_id": user["organization_id"], "is_deleted": True},
        {"$set": {"is_deleted": False, "deleted_at": None, "deleted_by": None, "updated_by": user["_id"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archived property not found")
    return await db.properties.find_one({"_id": obj_id})


async def restore_deal(db: AsyncIOMotorDatabase, deal_id: str, user: dict) -> dict:
    obj_id = _oid(deal_id)
    result = await db.deals.update_one(
        {"_id": obj_id, "organization_id": user["organization_id"], "is_deleted": True},
        {"$set": {"is_deleted": False, "deleted_at": None, "deleted_by": None, "updated_by": user["_id"]}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archived deal not found")
    return await db.deals.find_one({"_id": obj_id})


async def dashboard_stats(db: AsyncIOMotorDatabase, user: dict) -> dict:
    org_id = user["organization_id"]
    total_customers = await db.customers.count_documents({"organization_id": org_id, "is_deleted": {"$ne": True}})
    total_properties = await db.properties.count_documents({"organization_id": org_id, "is_deleted": {"$ne": True}})
    total_deals = await db.deals.count_documents({"organization_id": org_id, "is_deleted": {"$ne": True}})
    active_deals = await db.deals.count_documents({"organization_id": org_id, "status": "in_process", "is_deleted": {"$ne": True}})
    completed_deals = await db.deals.count_documents({"organization_id": org_id, "status": "completed", "is_deleted": {"$ne": True}})
    pipeline = [
        {"$match": {"organization_id": org_id, "status": "completed", "is_deleted": {"$ne": True}}},
        {"$unwind": "$financials"},
        {"$group": {"_id": None, "total": {"$sum": "$financials.org_revenue_cut"}}},
    ]
    revenue = await db.deals.aggregate(pipeline).to_list(length=1)
    total_revenue = float(revenue[0]["total"]) if revenue else 0.0
    return {
        "total_customers": total_customers,
        "total_properties": total_properties,
        "total_deals": total_deals,
        "active_deals": active_deals,
        "completed_deals": completed_deals,
        "total_revenue": total_revenue,
    }


async def agent_revenue_report(db: AsyncIOMotorDatabase, user: dict, window: str = "all") -> list[dict]:
    org_id = user["organization_id"]
    match_filter: dict = {"organization_id": org_id, "status": "completed", "is_deleted": {"$ne": True}}
    if window == "month":
        now = datetime.now(timezone.utc)
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        match_filter["date_completed"] = {"$gte": month_start}

    pipeline = [
        {"$match": match_filter},
        {"$unwind": "$financials"},
        {
            "$group": {
                "_id": "$created_by",
                "completed_deals": {"$sum": 1},
                "gross_revenue_total": {"$sum": "$financials.org_revenue_cut"},
                "org_commission_total": {"$sum": "$financials.org_revenue_cut"},
                "agent_commission_total": {"$sum": "$financials.user_revenue_cut"},
            }
        },
        {"$sort": {"org_commission_total": -1}},
    ]
    rows = await db.deals.aggregate(pipeline).to_list(length=500)
    user_ids = [row["_id"] for row in rows if row.get("_id")]
    user_map: dict[ObjectId, dict] = {}
    if user_ids:
        users = await db.users.find({"_id": {"$in": user_ids}}, {"name": 1, "phone": 1}).to_list(length=500)
        user_map = {u["_id"]: u for u in users}

    report: list[dict] = []
    for row in rows:
        user_doc = user_map.get(row["_id"], {})
        gross_revenue = float(row.get("gross_revenue_total", row.get("org_commission_total", 0)))
        agent_commission_total = float(row.get("agent_commission_total", 0))
        report.append(
            {
                "user_id": str(row["_id"]) if row.get("_id") else None,
                "agent_name": user_doc.get("name", "Unknown"),
                "agent_phone": user_doc.get("phone"),
                "completed_deals": int(row.get("completed_deals", 0)),
                "org_commission_total": gross_revenue - agent_commission_total,
                "agent_commission_total": agent_commission_total,
                "gross_revenue": gross_revenue,
            }
        )
    return report


async def agent_deal_breakdown(db: AsyncIOMotorDatabase, user: dict, agent_id: str, window: str = "all") -> list[dict]:
    org_id = user["organization_id"]
    match_filter: dict = {
        "organization_id": org_id,
        "status": "completed",
        "is_deleted": {"$ne": True},
        "created_by": _oid(agent_id),
    }
    if window == "month":
        now = datetime.now(timezone.utc)
        month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        match_filter["date_completed"] = {"$gte": month_start}

    deals = await db.deals.find(match_filter).sort("date_completed", -1).to_list(length=500)
    breakdown: list[dict] = []
    for deal in deals:
        financial = (deal.get("financials") or [{}])[0]
        customer = await db.customers.find_one({"_id": deal.get("customer_id")}, {"name": 1})
        prop = await db.properties.find_one({"_id": deal.get("property_id")}, {"title": 1})
        org_cut = float(financial.get("org_revenue_cut", 0))
        agent_cut = float(financial.get("user_revenue_cut", 0))
        breakdown.append(
            {
                "deal_id": str(deal["_id"]),
                "date_completed": deal.get("date_completed"),
                "deal_type": deal.get("deal_type"),
                "deal_value": float(financial.get("deal_price", 0)),
                "org_commission": org_cut - agent_cut,
                "agent_commission": agent_cut,
                "gross_revenue": org_cut,
                "customer_name": (customer or {}).get("name"),
                "property_title": (prop or {}).get("title"),
            }
        )
    return breakdown
