"""Lost & Found API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any, List, Optional
from datetime import datetime
import uuid

from app.api.deps import get_current_db, get_current_active_user, require_admin
from app.models.lost_item import LostItem
from app.models.found_item import FoundItem
from app.models.user import User

router = APIRouter()
admin_router = APIRouter()


class LostFoundReportRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "electronics"
    location: str = "Main Library"
    type: str = "lost"  # lost or found
    contact_phone: Optional[str] = None


class LostFoundItemOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    location: str
    type: str
    status: str
    reported_by: str
    reported_at: datetime

    class Config:
        from_attributes = True


def _get_item_location(item: Any, default: str = "Central Library") -> str:
    """Extract human-readable location from item relationships."""
    if hasattr(item, "location") and item.location and getattr(item.location, "name", None):
        return item.location.name
    if hasattr(item, "room") and item.room and getattr(item.room, "room_number", None):
        return f"Room {item.room.room_number}"
    return default


async def _resolve_location_id(db: AsyncSession, location_name: str) -> Optional[int]:
    """Find campus location id by name."""
    from app.models.campus_location import CampusLocation
    if not location_name:
        return None
    res = await db.execute(select(CampusLocation).where(CampusLocation.name.ilike(f"%{location_name}%")))
    loc = res.scalars().first()
    return loc.id if loc else None


@router.get("/items", response_model=List[LostFoundItemOut], tags=["lost-found"])
async def list_lost_found_items(
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List lost and found item reports."""
    items_out = []

    if not type or type == "lost":
        stmt = select(LostItem)
        if q:
            stmt = stmt.where((LostItem.category.ilike(f"%{q}%")) | (LostItem.description.ilike(f"%{q}%")))
        result = await db.execute(stmt)
        for li in result.scalars().all():
            items_out.append(
                LostFoundItemOut(
                    id=str(li.id),
                    title=li.name or f"{li.category.capitalize()} Item",
                    description=li.description,
                    category=li.category or "electronics",
                    location=_get_item_location(li, "Aurobindo Building"),
                    type="lost",
                    status=str(li.status or "lost"),
                    reported_by=str(li.reported_by_user_id),
                    reported_at=datetime.utcnow(),
                )
            )

    if not type or type == "found":
        stmt = select(FoundItem)
        if q:
            stmt = stmt.where((FoundItem.category.ilike(f"%{q}%")) | (FoundItem.description.ilike(f"%{q}%")))
        result = await db.execute(stmt)
        for fi in result.scalars().all():
            items_out.append(
                LostFoundItemOut(
                    id=str(fi.id),
                    title=fi.name or f"{fi.category.capitalize()} Item",
                    description=fi.description,
                    category=fi.category or "electronics",
                    location=_get_item_location(fi, "Central Library"),
                    type="found",
                    status=str(fi.status or "unclaimed"),
                    reported_by=str(fi.found_by_user_id),
                    reported_at=datetime.utcnow(),
                )
            )

    return items_out


@router.get("/items/{item_id}", response_model=LostFoundItemOut, tags=["lost-found"])
async def get_item_details(
    item_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single lost or found item details."""
    try:
        num_id = int(item_id)
        li_res = await db.execute(select(LostItem).where(LostItem.id == num_id))
        li = li_res.scalar_one_or_none()
        if li:
            return LostFoundItemOut(
                id=str(li.id),
                title=li.name or f"{li.category.capitalize()} Item",
                description=li.description,
                category=li.category or "electronics",
                location=_get_item_location(li, "Aurobindo Building"),
                type="lost",
                status=str(li.status or "lost"),
                reported_by=str(li.reported_by_user_id),
                reported_at=datetime.utcnow(),
            )

        fi_res = await db.execute(select(FoundItem).where(FoundItem.id == num_id))
        fi = fi_res.scalar_one_or_none()
        if fi:
            return LostFoundItemOut(
                id=str(fi.id),
                title=fi.name or f"{fi.category.capitalize()} Item",
                description=fi.description,
                category=fi.category or "electronics",
                location=_get_item_location(fi, "Central Library"),
                type="found",
                status=str(fi.status or "unclaimed"),
                reported_by=str(fi.found_by_user_id),
                reported_at=datetime.utcnow(),
            )
    except ValueError:
        pass

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost & Found item not found")


@router.post("/report", response_model=LostFoundItemOut, tags=["lost-found"])
async def report_item(
    payload: LostFoundReportRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new lost or found item report in PostgreSQL."""
    now_str = datetime.utcnow().isoformat()
    cat = payload.category.lower() if payload.category else "electronics"

    if payload.type == "found":
        fi = FoundItem(
            name=payload.title,
            category=cat,
            description=payload.description or payload.title,
            found_at=now_str,
            found_by_user_id=current_user.id,
            status="unclaimed",
        )
        db.add(fi)
        await db.commit()
        await db.refresh(fi)
        return LostFoundItemOut(
            id=str(fi.id),
            title=fi.name or payload.title,
            description=fi.description,
            category=fi.category,
            location=payload.location,
            type="found",
            status=fi.status,
            reported_by=str(fi.found_by_user_id),
            reported_at=datetime.utcnow(),
        )
    else:
        li = LostItem(
            name=payload.title,
            category=cat,
            description=payload.description or payload.title,
            reported_at=now_str,
            reported_by_user_id=current_user.id,
            status="lost",
        )
        db.add(li)
        await db.commit()
        await db.refresh(li)
        return LostFoundItemOut(
            id=str(li.id),
            title=li.name or payload.title,
            description=li.description,
            category=li.category,
            location=payload.location,
            type="lost",
            status=li.status,
            reported_by=str(li.reported_by_user_id),
            reported_at=datetime.utcnow(),
        )


class LostFoundAdminUpdateRequest(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None


@admin_router.get("/", response_model=List[LostFoundItemOut], tags=["admin-lost-found"])
async def admin_list_lost_found_items(
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Admin: list all lost and found items."""
    items_out = []

    if not type or type == "lost":
        stmt = select(LostItem).order_by(LostItem.reported_at.desc())
        result = await db.execute(stmt)
        for li in result.scalars().all():
            items_out.append(
                LostFoundItemOut(
                    id=str(li.id),
                    title=li.name or f"{li.category.capitalize()} Item",
                    description=li.description,
                    category=li.category or "electronics",
                    location="Campus Location",
                    type="lost",
                    status=str(li.status or "lost"),
                    reported_by=str(li.reported_by_user_id),
                    reported_at=datetime.utcnow(),
                )
            )

    if not type or type == "found":
        stmt = select(FoundItem).order_by(FoundItem.found_at.desc())
        result = await db.execute(stmt)
        for fi in result.scalars().all():
            items_out.append(
                LostFoundItemOut(
                    id=str(fi.id),
                    title=fi.name or f"{fi.category.capitalize()} Item",
                    description=fi.description,
                    category=fi.category or "electronics",
                    location="Campus Location",
                    type="found",
                    status=str(fi.status or "unclaimed"),
                    reported_by=str(fi.found_by_user_id),
                    reported_at=datetime.utcnow(),
                )
            )

    return items_out


@admin_router.patch("/{item_id}", response_model=LostFoundItemOut, tags=["admin-lost-found"])
async def admin_update_lost_found_item(
    item_id: str,
    payload: LostFoundAdminUpdateRequest,
    db: AsyncSession = Depends(get_current_db),
    _: User = Depends(require_admin),
):
    """Admin: update a lost or found item status/details."""
    try:
        num_id = int(item_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid item ID")

    li_res = await db.execute(select(LostItem).where(LostItem.id == num_id))
    li = li_res.scalar_one_or_none()
    if li:
        if payload.status is not None:
            li.status = payload.status
        if payload.description is not None:
            li.description = payload.description
        await db.commit()
        await db.refresh(li)
        return LostFoundItemOut(
            id=str(li.id),
            title=li.name or f"{li.category.capitalize()} Item",
            description=li.description,
            category=li.category or "electronics",
            location="Campus Location",
            type="lost",
            status=str(li.status or "lost"),
            reported_by=str(li.reported_by_user_id),
            reported_at=datetime.utcnow(),
        )

    fi_res = await db.execute(select(FoundItem).where(FoundItem.id == num_id))
    fi = fi_res.scalar_one_or_none()
    if fi:
        if payload.status is not None:
            fi.status = payload.status
        if payload.description is not None:
            fi.description = payload.description
        await db.commit()
        await db.refresh(fi)
        return LostFoundItemOut(
            id=str(fi.id),
            title=fi.name or f"{fi.category.capitalize()} Item",
            description=fi.description,
            category=fi.category or "electronics",
            location="Campus Location",
            type="found",
            status=str(fi.status or "unclaimed"),
            reported_by=str(fi.found_by_user_id),
            reported_at=datetime.utcnow(),
        )

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost & Found item not found")
