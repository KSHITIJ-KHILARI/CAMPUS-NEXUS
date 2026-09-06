"""Learning Hub Resources API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_current_db, get_current_active_user
from app.models import User, LearningResource, ResourceBookmark

router = APIRouter()


class ResourceOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str
    course_id: Optional[str] = None
    module_name: Optional[str] = None
    topic: Optional[str] = None
    difficulty: str
    duration_minutes: int
    url: Optional[str] = None
    rating: float
    rating_count: int

    class Config:
        from_attributes = True


class BookmarkPayload(BaseModel):
    resource_id: str


@router.get("", response_model=List[ResourceOut], tags=["resources"])
@router.get("/search", response_model=List[ResourceOut], tags=["resources"])
async def search_resources(
    q: Optional[str] = Query(None, description="Search query across title, topic, or module"),
    course_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_current_db),
):
    """Search or filter academic learning resources."""
    stmt = select(LearningResource)
    if q:
        pat = f"%{q}%"
        stmt = stmt.where(
            (LearningResource.title.ilike(pat)) |
            (LearningResource.topic.ilike(pat)) |
            (LearningResource.module_name.ilike(pat))
        )
    if course_id:
        stmt = stmt.where(LearningResource.course_id == course_id)
    if type:
        stmt = stmt.where(LearningResource.type == type)
    if difficulty:
        stmt = stmt.where(LearningResource.difficulty == difficulty)

    result = await db.execute(stmt)
    resources = result.scalars().all()
    return resources


@router.get("/{resource_id}", response_model=ResourceOut, tags=["resources"])
async def get_resource_details(
    resource_id: str,
    db: AsyncSession = Depends(get_current_db),
):
    """Get single learning resource by ID."""
    result = await db.execute(select(LearningResource).where(LearningResource.id == resource_id))
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return res


@router.post("/bookmark", tags=["resources"])
async def bookmark_resource(
    payload: BookmarkPayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_current_db),
):
    """Bookmark a learning resource for student profile."""
    existing = await db.execute(
        select(ResourceBookmark).where(
            ResourceBookmark.student_id == current_user.id,
            ResourceBookmark.resource_id == payload.resource_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Resource already bookmarked"}

    bookmark = ResourceBookmark(
        student_id=current_user.id,
        resource_id=payload.resource_id,
    )
    db.add(bookmark)
    await db.commit()
    return {"message": "Successfully bookmarked resource"}
