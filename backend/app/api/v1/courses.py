"""Courses API v1 routes for Campus NEXUS.

Provides student-facing read access to course catalog, including
department and program filtering.  Write operations remain admin-only
(see /admin/courses).
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_db, get_current_active_user
from app.models import Course, CourseSection, Department, Program
from app.models.user import User

router = APIRouter()


class CourseOut(BaseModel):
    id: str
    code: str
    name: str
    credits: int
    department: Optional[str] = None
    program: Optional[str] = None

    class Config:
        from_attributes = True


class CourseSectionOut(BaseModel):
    id: str
    course_code: str
    course_name: str
    section_number: str
    semester: str
    academic_year: str
    faculty_name: Optional[str] = None
    max_capacity: int
    enrolled_count: int
    is_active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[CourseOut], tags=["courses"])
@router.get("/", response_model=List[CourseOut], tags=["courses"])
async def list_courses(
    q: Optional[str] = Query(None, description="Search by course code or name"),
    department: Optional[str] = Query(None, description="Filter by department name"),
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List courses available to the current user."""
    stmt = select(Course).order_by(Course.code.asc())
    if q:
        pat = f"%{q}%"
        stmt = stmt.where((Course.code.ilike(pat)) | (Course.name.ilike(pat)))
    if department:
        stmt = stmt.join(Department).where(Department.name.ilike(f"%{department}%"))
    stmt = stmt.options(selectinload(Course.department))
    result = await db.execute(stmt)
    courses = result.scalars().all()
    return [
        CourseOut(
            id=str(c.id),
            code=c.code,
            name=c.name,
            credits=c.credits,
            department=c.department.name if c.department else None,
            program=None,
        )
        for c in courses
    ]


@router.get("/{course_id}", response_model=CourseOut, tags=["courses"])
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single course by ID."""
    result = await db.execute(select(Course).where(Course.id == course_id))
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseOut(
        id=str(c.id),
        code=c.code,
        name=c.name,
        credits=c.credits,
        department=c.department.name if c.department else None,
        program=c.program.name if c.program else None,
    )


@router.get("/{course_id}/sections", response_model=List[CourseSectionOut], tags=["courses"])
async def get_course_sections(
    course_id: int,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
):
    """List sections for a given course."""
    result = await db.execute(
        select(CourseSection)
        .options(
            selectinload(CourseSection.course),
            selectinload(CourseSection.faculty),
        )
        .where(CourseSection.course_id == course_id)
    )
    sections = result.scalars().all()
    return [
        CourseSectionOut(
            id=str(s.id),
            course_code=s.course.code if s.course else "",
            course_name=s.course.name if s.course else "",
            section_number=s.section_number,
            semester=s.semester,
            academic_year=s.academic_year,
            faculty_name=s.faculty.name if s.faculty else None,
            max_capacity=s.max_capacity,
            enrolled_count=s.enrolled_count,
            is_active=s.is_active,
        )
        for s in sections
    ]
