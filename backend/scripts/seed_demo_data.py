"""Comprehensive Seed Data for Campus NEXUS.

Populates PostgreSQL with realistic, interconnected data across students,
faculty, courses, timetables, rooms, library catalog, learning hub,
issues, crowd telemetry, and events.
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session_factory, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.campus_location import CampusLocation, LocationType
from app.models.issue import Issue, IssueCategory, IssuePriority, IssueStatus
from app.models import (
    Student, Faculty, Admin, Department, Program, Course, CourseSection, Enrollment,
    Building, Floor, Room, CrowdState, Lift, LiftStatus,
    Timetable, ClassSession, StudentSchedule, FacultyAvailability,
    Event, EventRegistration, LostItem, FoundItem, Notification,
    LibraryBook, LibraryBookCopy, LibraryReservation, LibrarySeat,
    LearningResource, ResourceBookmark, FAQEntry, KnowledgeDocument
)
from sqlalchemy import select


async def seed_all():
    print("Starting comprehensive database seeding...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)

    async with async_session_factory() as session:
        # 1. Users (UUID primary keys)
        student_user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        faculty_user_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
        admin_user_id = uuid.UUID("33333333-3333-3333-3333-333333333333")

        users_info = [
            {"id": student_user_id, "email": "student@somaiya.edu", "full_name": "Arjun Mehta", "role": UserRole.STUDENT},
            {"id": faculty_user_id, "email": "faculty@somaiya.edu", "full_name": "Dr. Priya Sharma", "role": UserRole.FACULTY},
            {"id": admin_user_id, "email": "admin@somaiya.edu", "full_name": "Admin Control", "role": UserRole.ADMIN},
            {"id": uuid.UUID("44444444-4444-4444-4444-444444444444"), "email": "rahul.s@somaiya.edu", "full_name": "Rahul Sharma", "role": UserRole.STUDENT},
            {"id": uuid.UUID("55555555-5555-5555-5555-555555555555"), "email": "prof.smith@somaiya.edu", "full_name": "Dr. Rajesh Smith", "role": UserRole.FACULTY},
        ]

        user_objs = {}
        for u in users_info:
            existing = await session.execute(select(User).where(User.email == u["email"]))
            u_obj = existing.scalar_one_or_none()
            if not u_obj:
                u_obj = User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=hash_password("demo123"),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True,
                    is_verified=True,
                )
                session.add(u_obj)
            user_objs[u["email"]] = u_obj
        await session.flush()

        # 2. Departments & Programs (Integer Primary Keys)
        dept_cs = await session.execute(select(Department).where(Department.code == "CS"))
        dept_cs_obj = dept_cs.scalar_one_or_none()
        if not dept_cs_obj:
            dept_cs_obj = Department(code="CS", name="Computer Science & Engineering", description="Department of Computer Science")
            session.add(dept_cs_obj)
            await session.flush()

        prog_btech = await session.execute(select(Program).where(Program.code == "BTECH_CS"))
        prog_btech_obj = prog_btech.scalar_one_or_none()
        if not prog_btech_obj:
            prog_btech_obj = Program(department_id=dept_cs_obj.id, code="BTECH_CS", name="B.Tech Computer Science", duration_years=4)
            session.add(prog_btech_obj)
            await session.flush()

        # 3. Student & Faculty Profiles
        existing_stud = await session.execute(select(Student).where(Student.user_id == student_user_id))
        student_profile = existing_stud.scalar_one_or_none()
        if not student_profile:
            student_profile = Student(
                user_id=student_user_id,
                roll_number="1012023001",
                department_id=dept_cs_obj.id,
                program_id=prog_btech_obj.id,
                current_semester=5,
                cgpa=8.9,
            )
            session.add(student_profile)

        existing_fac = await session.execute(select(Faculty).where(Faculty.user_id == faculty_user_id))
        faculty_profile = existing_fac.scalar_one_or_none()
        if not faculty_profile:
            faculty_profile = Faculty(
                user_id=faculty_user_id,
                employee_id="EMP_CS_01",
                department_id=dept_cs_obj.id,
                designation="Associate Professor",
                office_location="CSB-302",
            )
            session.add(faculty_profile)
        await session.flush()

        # 4. Buildings, Floors & Rooms
        buildings_spec = [
            {"name": "Main Academic Block", "code": "MAB", "floors": 4},
            {"name": "Computer Science Building", "code": "CSB", "floors": 5},
            {"name": "Library & Learning Center", "code": "LLC", "floors": 3},
            {"name": "Student Activity Center", "code": "STC", "floors": 3},
        ]

        bldg_map = {}
        for bspec in buildings_spec:
            res = await session.execute(select(Building).where(Building.code == bspec["code"]))
            b_obj = res.scalar_one_or_none()
            if not b_obj:
                b_obj = Building(
                    name=bspec["name"],
                    code=bspec["code"],
                    num_floors=bspec["floors"],
                    latitude=19.0728,
                    longitude=72.8836,
                    is_accessible=True,
                )
                session.add(b_obj)
                await session.flush()
            bldg_map[bspec["code"]] = b_obj

        rooms_by_name = {}
        target_room_numbers = ["101", "102", "201", "301", "302", "401", "501"]
        for bcode, b_obj in bldg_map.items():
            for fnum in range(1, (b_obj.num_floors or 3) + 1):
                floor_res = await session.execute(select(Floor).where(Floor.building_id == b_obj.id, Floor.floor_number == fnum))
                floor_obj = floor_res.scalar_one_or_none()
                if not floor_obj:
                    floor_obj = Floor(building_id=b_obj.id, floor_number=fnum, name=f"Floor {fnum}")
                    session.add(floor_obj)
                    await session.flush()

                for rnum in target_room_numbers[:3]:
                    r_no = f"{fnum}{rnum}"
                    r_res = await session.execute(select(Room).where(Room.building_id == b_obj.id, Room.room_number == r_no))
                    rm_obj = r_res.scalar_one_or_none()
                    if not rm_obj:
                        rm_obj = Room(
                            building_id=b_obj.id,
                            floor_id=floor_obj.id,
                            room_number=r_no,
                            name=f"{bcode} {r_no}",
                            room_type="classroom" if rnum != "301" else "laboratory",
                            capacity=60 if rnum == "101" else 40,
                            is_accessible=True,
                        )
                        session.add(rm_obj)
                        await session.flush()
                    rooms_by_name[f"{bcode}_{r_no}"] = rm_obj

        # 5. Courses, Course Sections & Class Sessions
        course_dbms = await session.execute(select(Course).where(Course.code == "CS301"))
        c_dbms_obj = course_dbms.scalar_one_or_none()
        if not c_dbms_obj:
            c_dbms_obj = Course(code="CS301", name="Database Management Systems", department_id=dept_cs_obj.id, program_id=prog_btech_obj.id, credits=4)
            session.add(c_dbms_obj)
            await session.flush()

        course_os = await session.execute(select(Course).where(Course.code == "CS302"))
        c_os_obj = course_os.scalar_one_or_none()
        if not c_os_obj:
            c_os_obj = Course(code="CS302", name="Operating Systems", department_id=dept_cs_obj.id, program_id=prog_btech_obj.id, credits=4)
            session.add(c_os_obj)
            await session.flush()

        # CourseSection
        section_dbms = await session.execute(select(CourseSection).where(CourseSection.course_id == c_dbms_obj.id, CourseSection.section_number == "A"))
        c_sec_obj = section_dbms.scalar_one_or_none()
        if not c_sec_obj:
            c_sec_obj = CourseSection(
                course_id=c_dbms_obj.id,
                section_number="A",
                semester="Fall 2024",
                academic_year="2024-2025",
                faculty_id=faculty_profile.id,
                faculty_name="Dr. Priya Sharma",
                max_capacity=60,
                enrolled_count=45,
            )
            session.add(c_sec_obj)
            await session.flush()

        room_302 = rooms_by_name.get("CSB_302") or list(rooms_by_name.values())[0]

        now = datetime.utcnow()
        today_date = now.strftime("%Y-%m-%d")

        sess_res = await session.execute(select(ClassSession).where(ClassSession.course_section_id == c_sec_obj.id))
        sess_obj = sess_res.scalar_one_or_none()
        if not sess_obj:
            sess_obj = ClassSession(
                course_section_id=c_sec_obj.id,
                room_id=room_302.id,
                faculty_id=faculty_profile.id,
                start_time="14:00",
                end_time="15:30",
                day_of_week=now.strftime("%A").lower(),
                session_type="lecture",
            )
            session.add(sess_obj)
            await session.flush()

            sched_res = await session.execute(select(StudentSchedule).where(StudentSchedule.id == "sched_std_001"))
            if not sched_res.scalar_one_or_none():
                start_dt = datetime.strptime(f"{today_date} 14:00", "%Y-%m-%d %H:%M")
                end_dt = datetime.strptime(f"{today_date} 15:30", "%Y-%m-%d %H:%M")
                sched_student = StudentSchedule(
                    id="sched_std_001",
                    student_id=student_profile.id,
                    class_session_id=sess_obj.id,
                    day_of_week=now.weekday(),
                    start_time=start_dt,
                    end_time=end_dt,
                    course_code="CS301",
                    course_name="Database Management Systems",
                    faculty_name="Dr. Priya Sharma",
                    room_number=room_302.room_number,
                    building_name="Computer Science Building",
                    session_type="lecture",
                    color="bg-brand-600",
                )
                session.add(sched_student)
                await session.flush()

        # 6. Library Books, Copies, Reservations & Seats
        books_data = [
            {"id": "book_dbms", "title": "Database System Concepts", "author": "Silberschatz, Korth, Sudarshan", "isbn": "978-0073523323", "subject": "DBMS", "department": "Computer Science", "shelf": "CS-04-B", "total": 5, "avail": 3},
            {"id": "book_os", "title": "Operating System Concepts", "author": "Silberschatz, Galvin, Gagne", "isbn": "978-1118063330", "subject": "Operating Systems", "department": "Computer Science", "shelf": "CS-02-A", "total": 4, "avail": 2},
            {"id": "book_algo", "title": "Introduction to Algorithms", "author": "Cormen, Leiserson, Rivest, Stein", "isbn": "978-0262033848", "subject": "Data Structures", "department": "Computer Science", "shelf": "CS-01-C", "total": 6, "avail": 4},
        ]

        for bd in books_data:
            existing_b = await session.execute(select(LibraryBook).where(LibraryBook.id == bd["id"]))
            if not existing_b.scalar_one_or_none():
                b_obj = LibraryBook(
                    id=bd["id"],
                    title=bd["title"],
                    author=bd["author"],
                    isbn=bd["isbn"],
                    subject=bd["subject"],
                    department=bd["department"],
                    shelf_location=bd["shelf"],
                    total_copies=bd["total"],
                    available_copies=bd["avail"],
                )
                session.add(b_obj)
                await session.flush()
                for copy_idx in range(1, bd["total"] + 1):
                    copy_status = "available" if copy_idx <= bd["avail"] else "borrowed"
                    c_obj = LibraryBookCopy(
                        id=f"copy_{bd['id']}_{copy_idx}",
                        book_id=b_obj.id,
                        copy_number=copy_idx,
                        status=copy_status,
                    )
                    session.add(c_obj)

        zones = ["silent", "group_study", "reading_hall", "computer_area"]
        for z in zones:
            for s_num in range(1, 10):
                seat_id = f"seat_{z}_{s_num}"
                existing_seat = await session.execute(select(LibrarySeat).where(LibrarySeat.id == seat_id))
                if not existing_seat.scalar_one_or_none():
                    seat_obj = LibrarySeat(
                        id=seat_id,
                        zone=z,
                        seat_number=f"{z.upper()[:2]}-{s_num:02d}",
                        is_occupied=(s_num % 3 == 0),
                    )
                    session.add(seat_obj)
        await session.flush()

        # 7. Learning Resources
        resources_data = [
            {"id": "res_dbms_1", "title": "Complete Normalization Tutorial & Examples", "type": "video", "course_id": str(c_dbms_obj.id), "module": "Normalization", "topic": "3NF & BCNF", "duration": 25, "url": "https://www.youtube.com/watch?v=k8vJg2u9K8w"},
            {"id": "res_dbms_2", "title": "SQL Join Optimization & Query Execution", "type": "notes", "course_id": str(c_dbms_obj.id), "module": "Relational Algebra", "topic": "Joins", "duration": 15, "url": "https://somaiya.edu/notes/dbms-joins.pdf"},
            {"id": "res_os_1", "title": "Process Synchronization & Semaphore Practice Set", "type": "practice_set", "course_id": str(c_os_obj.id), "module": "Concurrency", "topic": "Semaphores", "duration": 45, "url": "https://somaiya.edu/practice/os-concurrency.pdf"},
        ]

        for rd in resources_data:
            r_res = await session.execute(select(LearningResource).where(LearningResource.id == rd["id"]))
            if not r_res.scalar_one_or_none():
                lr_obj = LearningResource(
                    id=rd["id"],
                    title=rd["title"],
                    type=rd["type"],
                    course_id=rd["course_id"],
                    module_name=rd["module"],
                    topic=rd["topic"],
                    duration_minutes=rd["duration"],
                    url=rd["url"],
                    rating=4.8,
                )
                session.add(lr_obj)
        await session.flush()

        # 8. FAQ Entries
        faqs = [
            {"id": "faq_1", "q": "How many books can a student borrow at a time?", "a": "Undergraduate students can borrow up to 4 books simultaneously for 14 days. Postgraduates can borrow up to 6 books.", "cat": "library"},
            {"id": "faq_2", "q": "How do I report classroom equipment issues like broken projectors?", "a": "You can use the Campus NEXUS Report Issue feature on your dashboard or student mobile app to submit issues directly to maintenance.", "cat": "it"},
            {"id": "faq_3", "q": "Where is the Faculty of Computer Science office located?", "a": "The Computer Science faculty offices are located on the 3rd Floor of the Computer Science Building (CSB).", "cat": "academics"},
        ]
        for f in faqs:
            fq_res = await session.execute(select(FAQEntry).where(FAQEntry.id == f["id"]))
            if not fq_res.scalar_one_or_none():
                fq_obj = FAQEntry(id=f["id"], question=f["q"], answer=f["a"], category=f["cat"])
                session.add(fq_obj)
        await session.flush()

        # 9. Campus Locations & Crowd Telemetry
        loc_res = await session.execute(select(CampusLocation).where(CampusLocation.name == "Central Library"))
        lib_loc = loc_res.scalar_one_or_none()
        if not lib_loc:
            lib_loc = CampusLocation(name="Central Library", location_type=LocationType.LIBRARY, latitude=19.0735, longitude=72.8845)
            session.add(lib_loc)
            await session.flush()

        cs_res = await session.execute(select(CrowdState).where(CrowdState.location_id == lib_loc.id))
        if not cs_res.scalar_one_or_none():
            cs_obj = CrowdState(
                location_id=lib_loc.id,
                current_count=65,
                capacity=120,
                occupancy_ratio=0.54,
                trend="stable",
                density_level="moderate",
                confidence_score=0.92,
                last_updated=now.strftime("%Y-%m-%d %H:%M:%S"),
            )
            session.add(cs_obj)
            await session.flush()

        # 10. Lifts
        csb_bldg = bldg_map["CSB"]
        lift_res = await session.execute(select(Lift).where(Lift.building_id == csb_bldg.id, Lift.lift_number == 1))
        if not lift_res.scalar_one_or_none():
            lift_obj = Lift(id="lift_csb_1", building_id=csb_bldg.id, lift_number=1, status="working", current_floor=1, capacity=12)
            session.add(lift_obj)
            await session.flush()

        # 11. Issues
        iss_res = await session.execute(select(Issue).where(Issue.id == "issue_proj_csb"))
        if not iss_res.scalar_one_or_none():
            issue_1 = Issue(
                id="issue_proj_csb",
                title="CSB 301 Projector Color Distortion",
                description="Projector displays strong purple tint during lectures.",
                category=IssueCategory.PROJECTOR.value,
                priority=IssuePriority.MEDIUM.value,
                status=IssueStatus.OPEN.value,
                location_id=lib_loc.id,
                report_count=3,
                confidence=0.95,
            )
            session.add(issue_1)

        # 12. Notifications
        notif_res = await session.execute(select(Notification).where(Notification.id == "notif_welcome_1"))
        if not notif_res.scalar_one_or_none():
            notif_std = Notification(
                id="notif_welcome_1",
                recipient_id=student_user_id,
                event="class_reminder",
                reason="Your DBMS lecture starts at 2:00 PM in CSB 302.",
                priority="important",
                read=False,
                data='{"class": "DBMS", "room": "CSB 302", "time": "2:00 PM"}',
            )
            session.add(notif_std)

        # Commit transaction
        await session.commit()
        print("Database seeding completed cleanly and successfully!")


if __name__ == "__main__":
    asyncio.run(seed_all())
