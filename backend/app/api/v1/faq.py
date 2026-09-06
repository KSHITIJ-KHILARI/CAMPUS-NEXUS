"""FAQ and Knowledge base API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.api.deps import get_current_db
from app.models import FAQEntry

router = APIRouter()


class FAQOut(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    department: str
    source: str

    class Config:
        from_attributes = True


@router.get("", response_model=List[FAQOut], tags=["faq"])
@router.get("/search", response_model=List[FAQOut], tags=["faq"])
async def search_faq(
    q: Optional[str] = Query(None, description="Search query across question or answer"),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_current_db),
):
    """Search university FAQ knowledge base."""
    stmt = select(FAQEntry)
    if q:
        pat = f"%{q}%"
        stmt = stmt.where((FAQEntry.question.ilike(pat)) | (FAQEntry.answer.ilike(pat)))
    if category:
        stmt = stmt.where(FAQEntry.category == category)

    result = await db.execute(stmt)
    return result.scalars().all()
