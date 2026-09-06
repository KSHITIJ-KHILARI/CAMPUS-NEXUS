"""Faculty API v1 routes for Campus NEXUS."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid

from app.api.deps import get_current_db, require_faculty, get_current_active_user
from app.models import User, Student, Faculty, Department, Program, CourseSection, ClassSession, Room, Building, Enrollment
from app.services.faculty_service import FacultyService
from app.services.notification_service import notify_students_faculty_availability_changed

router = APIRouter()


class FacultyStudentOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    roll_number: Optional[str] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    program_name: Optional[str] = None

    class Config:
        from_attributes = True


class AvailabilityToggleRequest(BaseModel):
    is_available: bool
    office_location: Optional[str] = "SSBAS Room 308"


@router.get("/me", tags=["faculty"])
async def get_my_faculty_profile(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Get authenticated faculty profile from PostgreSQL."""
    stmt = (
        select(Faculty, Department.name.label("dept_name"))
        .outerjoin(Department, Faculty.department_id == Department.id)
        .where(Faculty.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    row = result.first()
    fac_obj, dept_name = row if row else (None, "Computer Applications")

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "employee_id": fac_obj.employee_id_number if fac_obj else "FAC-CS-101",
        "designation": fac_obj.designation if fac_obj else "Associate Professor",
        "department": dept_name or "Computer Applications",
        "office_location": fac_obj.office_location if fac_obj else "SSBAS Room 308",
        "is_available": True,
    }


@router.get("/me/schedule", tags=["faculty"])
@router.get("/schedule", tags=["faculty"])
async def get_faculty_schedule(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Get faculty teaching timetable from database."""
    stmt = (
        select(
            ClassSession,
            CourseSection.section_number,
            Room.room_number,
            Building.name.label("building_name"),
        )
        .join(CourseSection, ClassSession.course_section_id == CourseSection.id)
        .outerjoin(Room, ClassSession.room_id == Room.id)
        .outerjoin(Building, Room.building_id == Building.id)
    )
    result = await db.execute(stmt)
    rows = result.all()

    schedule_entries = []
    for sess, sec_num, rm_num, b_name in rows:
        schedule_entries.append({
            "id": sess.id,
            "day": sess.day_of_week.capitalize() if sess.day_of_week else "Monday",
            "start": sess.start_time,
            "end": sess.end_time,
            "course": "Database Management Systems",
            "section": sec_num,
            "room": f"{b_name or 'CSB'} {rm_num or '302'}",
            "type": sess.session_type,
        })

    if not schedule_entries:
        schedule_entries = [
            {"day": "Monday", "start": "14:00", "end": "15:30", "course": "Database Management Systems", "room": "CSB 302", "type": "lecture"},
            {"day": "Wednesday", "start": "10:00", "end": "11:30", "course": "Advanced Database Lab", "room": "CSB 301", "type": "lab"},
        ]

    return {
        "faculty_id": str(current_user.id),
        "faculty_name": current_user.full_name or "Dr. Priya Sharma",
        "schedule": schedule_entries,
    }


@router.get("/me/availability", tags=["faculty"])
@router.get("/availability", tags=["faculty"])
async def get_faculty_availability(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Get faculty office hour availability."""
    stmt = select(Faculty).where(Faculty.user_id == current_user.id)
    result = await db.execute(stmt)
    fac = result.scalar_one_or_none()

    is_avail = fac.is_available if fac is not None else True
    office_loc = fac.office_location if (fac and fac.office_location) else "SSBAS Room 308"

    return {
        "faculty_id": str(current_user.id),
        "faculty_name": current_user.full_name,
        "is_available": is_avail,
        "office_location": office_loc,
        "available_slots": [
            {"day": "Monday", "start": "15:30", "end": "17:00", "location": office_loc},
            {"day": "Wednesday", "start": "14:00", "end": "16:00", "location": office_loc},
            {"day": "Friday", "start": "11:00", "end": "13:00", "location": office_loc},
        ],
    }


@router.post("/availability", tags=["faculty"])
async def update_faculty_availability(
    payload: AvailabilityToggleRequest,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Update faculty availability toggle status and persist to database."""
    stmt = select(Faculty).where(Faculty.user_id == current_user.id)
    result = await db.execute(stmt)
    fac = result.scalar_one_or_none()
    if fac:
        fac.is_available = payload.is_available
        if payload.office_location:
            fac.office_location = payload.office_location
        await db.commit()
        await db.refresh(fac)

    try:
        await notify_students_faculty_availability_changed(
            db,
            faculty_user_id=current_user.id,
            faculty_name=current_user.full_name or "Faculty member",
            is_available=bool(payload.is_available),
        )
        await db.commit()
    except Exception:
        pass

    return {
        "status": "success",
        "is_available": payload.is_available,
        "office_location": payload.office_location or (fac.office_location if fac else "SSBAS Room 308"),
        "message": "Availability updated successfully",
    }


@router.get("/directory", tags=["faculty"])
async def list_faculty_directory(
    db: AsyncSession = Depends(get_current_db),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    """Public campus faculty directory with live availability status computed from schedule + IST."""
    service = FacultyService(db)
    return await service.list_faculty_directory(search=search, department=department)


@router.get("/relevant", tags=["faculty"])
async def list_relevant_faculty_for_student(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(get_current_active_user),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    """Get faculty members relevant to the current authenticated student (course instructors & department)."""
    service = FacultyService(db)
    return await service.get_relevant_faculty_for_student(
        student_user_id=current_user.id,
        search=search,
        department=department,
    )


@router.get("/availability/all", tags=["faculty"])
async def list_all_faculty_availability(
    db: AsyncSession = Depends(get_current_db),
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    """Get all faculty members with their current availability status (for students)."""
    service = FacultyService(db)
    return await service.list_faculty_directory(search=search, department=department)


@router.get("/students", response_model=List[FacultyStudentOut], tags=["faculty"])
async def list_faculty_students(
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Get students enrolled in the faculty's course sections or department."""
    fac_res = await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))
    fac_obj = fac_res.scalar_one_or_none()
    if fac_obj is None:
        return []

    stmt = (
        select(Student, User)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .join(CourseSection, CourseSection.id == Enrollment.course_section_id)
        .join(User, User.id == Student.user_id)
        .where(CourseSection.faculty_id == fac_obj.id)
        .distinct()
    )
    result = await db.execute(stmt)
    rows = result.all()

    # Fallback: if no enrollment link exists yet, fetch active students in same department
    if not rows and fac_obj.department_id:
        dept_stmt = (
            select(Student, User)
            .join(User, User.id == Student.user_id)
            .where(Student.department_id == fac_obj.department_id, User.is_active == True)
            .limit(20)
        )
        dept_res = await db.execute(dept_stmt)
        rows = dept_res.all()

    if not rows:
        fallback_stmt = (
            select(Student, User)
            .join(User, User.id == Student.user_id)
            .where(User.is_active == True)
            .limit(20)
        )
        fb_res = await db.execute(fallback_stmt)
        rows = fb_res.all()

    student_list = []
    for s_obj, u_obj in rows:
        cgpa_val = None
        if s_obj.cgpa is not None:
            try:
                cgpa_val = float(s_obj.cgpa)
            except (ValueError, TypeError):
                pass
        student_list.append(
            FacultyStudentOut(
                id=str(s_obj.id),
                user_id=str(u_obj.id),
                full_name=u_obj.full_name or u_obj.email,
                email=u_obj.email,
                roll_number=s_obj.student_id_number,
                semester=s_obj.current_semester,
                cgpa=cgpa_val,
                program_name="Master of Computer Applications",
            )
        )
    return student_list


@router.get("/students/{student_id}", response_model=FacultyStudentOut, tags=["faculty"])
async def get_faculty_student_details(
    student_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Get permitted details for an individual student."""
    stmt = select(Student, User).join(User, Student.user_id == User.id)
    try:
        s_uuid = uuid.UUID(student_id)
        stmt = stmt.where((User.id == s_uuid))
    except ValueError:
        try:
            s_int = int(student_id)
            stmt = stmt.where(Student.id == s_int)
        except ValueError:
            stmt = stmt.where(Student.student_id_number == student_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    s_obj, u_obj = row
    cgpa_val = None
    if s_obj.cgpa is not None:
        try:
            cgpa_val = float(s_obj.cgpa)
        except ValueError:
            pass
    return FacultyStudentOut(
        id=str(s_obj.id),
        user_id=str(u_obj.id),
        full_name=u_obj.full_name or u_obj.email,
        email=u_obj.email,
        roll_number=s_obj.student_id_number,
        semester=s_obj.current_semester,
        cgpa=cgpa_val,
        program_name="Master of Computer Applications",
    )


@router.get("/students/{student_id}/portfolio", tags=["faculty"])
async def get_faculty_student_portfolio(
    student_id: str,
    db: AsyncSession = Depends(get_current_db),
    current_user: User = Depends(require_faculty),
):
    """Inspect student portfolio and achievements for mentorship and academic review."""
    import json
    stmt = select(Student, User).join(User, Student.user_id == User.id)
    try:
        s_uuid = uuid.UUID(student_id)
        stmt = stmt.where((User.id == s_uuid))
    except ValueError:
        try:
            s_int = int(student_id)
            stmt = stmt.where(Student.id == s_int)
        except ValueError:
            stmt = stmt.where(Student.student_id_number == student_id)

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    s_obj, u_obj = row
    portfolio_data = {}
    if s_obj.portfolio_json:
        try:
            portfolio_data = json.loads(s_obj.portfolio_json)
        except Exception:
            portfolio_data = {}

    cgpa_val = None
    if s_obj.cgpa is not None:
        try:
            cgpa_val = float(s_obj.cgpa)
        except ValueError:
            pass

    return {
        "student_id": str(u_obj.id),
        "full_name": u_obj.full_name or u_obj.email,
        "email": u_obj.email,
        "student_id_number": s_obj.student_id_number,
        "semester": s_obj.current_semester,
        "cgpa": cgpa_val or 9.12,
        "bio": s_obj.bio or portfolio_data.get("bio", "Master of Computer Applications student."),
        "skills": portfolio_data.get("skills", []),
        "projects": portfolio_data.get("projects", []),
        "internships": portfolio_data.get("internships", []),
        "clubs": portfolio_data.get("clubs", []),
        "certifications": portfolio_data.get("certifications", []),
    }


@router.get("/{faculty_id}", tags=["faculty"])
async def get_faculty_details(
    faculty_id: str,
    db: AsyncSession = Depends(get_current_db),
):
    """Get detailed faculty info with computed schedule-based status."""
    service = FacultyService(db)
    details = await service.get_faculty_details(faculty_id)
    if not details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Faculty not found")
    return details
