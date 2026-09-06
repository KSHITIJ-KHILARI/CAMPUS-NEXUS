"""Campus NEXUS Production Seed Data Engine.

Ensures realistic, deterministic, and relational seed data for Somaiya Vidyavihar University:
- Users (Student, Faculty, Admin)
- Departments & Programs
- Students & Faculty with portfolios and assigned courses
- Buildings, Floors, Classrooms, and Laboratories
- Courses, Course Sections, Class Sessions, Student Schedules, and Enrollments
- Campus Locations, Real-time Rush Telemetry, Lifts
- Library Books, Copies, Seats
- Academic Learning Resources
- Issues, Lost & Found, Events, Notifications
"""

from datetime import datetime, timedelta, time
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.security import hash_password, verify_password
from app.models import (
    User, UserRole, Student, Faculty, Admin, Department, Program, Course, CourseSection,
    ClassSession, Building, Floor, Room, CampusLocation,
    Lift, LiftStatusRecord, StudentSchedule, Enrollment,
    CrowdReport, CrowdState, BuzzPost, Issue, LostItem, FoundItem,
    Event, Notification, LibraryBook, LibraryBookCopy,
    LibrarySeat, LearningResource
)

logger = logging.getLogger(__name__)


async def seed_campus_data(db: AsyncSession) -> None:
    """Idempotently seed all core campus database entities."""
    logger.info("Verifying and seeding core Somaiya campus data...")

    # 1. Users
    demo_users = [
        {
            "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
            "email": "student@somaiya.edu",
            "full_name": "Arjun Mehta",
            "role": UserRole.STUDENT,
        },
        {
            "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
            "email": "faculty@somaiya.edu",
            "full_name": "Dr. Priya Sharma",
            "role": UserRole.FACULTY,
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "email": "admin@somaiya.edu",
            "full_name": "Campus Administrator",
            "role": UserRole.ADMIN,
        },
        {
            "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
            "email": "diya.shah@somaiya.edu",
            "full_name": "Diya Shah",
            "role": UserRole.STUDENT,
        },
        {
            "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
            "email": "rajesh.kumar@somaiya.edu",
            "full_name": "Dr. Rajesh Kumar",
            "role": UserRole.FACULTY,
        },
    ]

    user_map = {}
    for u in demo_users:
        res = await db.execute(select(User).where(User.email == u["email"]))
        existing = res.scalar_one_or_none()
        if not existing:
            existing = User(
                id=u["id"],
                email=u["email"],
                hashed_password=hash_password("demo123"),
                full_name=u["full_name"],
                role=u["role"],
                is_active=True,
                is_verified=True,
            )
            db.add(existing)
        else:
            existing.full_name = u["full_name"]
            existing.role = u["role"]
            if not verify_password("demo123", str(existing.hashed_password or "")):
                existing.hashed_password = hash_password("demo123")
            existing.is_active = True
            existing.is_verified = True
        await db.flush()
        user_map[u["email"]] = existing

    # 2. Departments & Programs
    dept_res = await db.execute(select(Department).where(Department.code == "CS"))
    dept = dept_res.scalar_one_or_none()
    if not dept:
        dept = Department(
            name="Computer Applications & Information Technology",
            code="CS",
            building_id=None,
        )
        db.add(dept)
        await db.flush()

    prog_res = await db.execute(select(Program).where(Program.code == "MCA"))
    prog = prog_res.scalar_one_or_none()
    if not prog:
        prog = Program(
            name="Master of Computer Applications",
            code="MCA",
            department_id=dept.id,
            duration_years=2,
        )
        db.add(prog)
        await db.flush()

    # 3. Student & Faculty Entities
    student_user = user_map["student@somaiya.edu"]
    stu_res = await db.execute(select(Student).where(Student.user_id == student_user.id))
    student = stu_res.scalar_one_or_none()
    if not student:
        student = Student(
            user_id=student_user.id,
            student_id_number="2024001",
            enrollment_date="2024-08-01",
            program_id=prog.id,
            department_id=dept.id,
            academic_year="2024-2026",
            current_semester=4,
            cgpa="9.12",
        )
        db.add(student)
        await db.flush()

    # Secondary Student
    diya_user = user_map["diya.shah@somaiya.edu"]
    diya_stu_res = await db.execute(select(Student).where(Student.user_id == diya_user.id))
    diya_student = diya_stu_res.scalar_one_or_none()
    if not diya_student:
        diya_student = Student(
            user_id=diya_user.id,
            student_id_number="2024002",
            enrollment_date="2024-08-01",
            program_id=prog.id,
            department_id=dept.id,
            academic_year="2024-2026",
            current_semester=4,
            cgpa="8.95",
        )
        db.add(diya_student)
        await db.flush()

    faculty_user = user_map["faculty@somaiya.edu"]
    fac_res = await db.execute(select(Faculty).where(Faculty.user_id == faculty_user.id))
    faculty = fac_res.scalar_one_or_none()
    if not faculty:
        faculty = Faculty(
            user_id=faculty_user.id,
            employee_id_number="FAC-CS-101",
            designation="Associate Professor",
            department_id=dept.id,
            join_date="2020-07-15",
            office_location="SSBAS Room 308",
            is_available=True,
        )
        db.add(faculty)
        await db.flush()

    # Secondary Faculty
    rajesh_user = user_map["rajesh.kumar@somaiya.edu"]
    rajesh_fac_res = await db.execute(select(Faculty).where(Faculty.user_id == rajesh_user.id))
    rajesh_faculty = rajesh_fac_res.scalar_one_or_none()
    if not rajesh_faculty:
        rajesh_faculty = Faculty(
            user_id=rajesh_user.id,
            employee_id_number="FAC-CS-102",
            designation="Professor & Head",
            department_id=dept.id,
            join_date="2016-08-01",
            office_location="SSBAS Room 402",
            is_available=True,
        )
        db.add(rajesh_faculty)
        await db.flush()

    admin_user = user_map["admin@somaiya.edu"]
    adm_res = await db.execute(select(Admin).where(Admin.user_id == admin_user.id))
    if not adm_res.scalar_one_or_none():
        admin = Admin(
            user_id=admin_user.id,
            employee_id_number="ADM-001",
            admin_role="system_admin",
            join_date="2018-01-10",
            permissions="all",
        )
        db.add(admin)
        await db.flush()

    # 4. Buildings
    buildings_data = [
        {
            "name": "Computer Science Building (SSBAS)",
            "code": "SSBAS",
            "address": "Somaiya Vidyavihar Main Campus, Sector 2",
            "latitude": 19.0760,
            "longitude": 72.8770,
            "num_floors": 4,
        },
        {
            "name": "Aurobindo Building",
            "code": "AURO",
            "address": "Somaiya Vidyavihar Main Campus, Sector 1",
            "latitude": 19.0765,
            "longitude": 72.8775,
            "num_floors": 4,
        },
        {
            "name": "Bhaskaracharya Academic Block",
            "code": "BHAK",
            "address": "Somaiya Vidyavihar Main Campus, Sector 3",
            "latitude": 19.0755,
            "longitude": 72.8780,
            "num_floors": 5,
        },
        {
            "name": "Central Library & Learning Resource Center",
            "code": "LIB",
            "address": "Somaiya Vidyavihar Main Campus, Central Ring",
            "latitude": 19.0758,
            "longitude": 72.8772,
            "num_floors": 3,
        },
        {
            "name": "Main Campus Canteen",
            "code": "CANT",
            "address": "Somaiya Vidyavihar Campus Quadrangle",
            "latitude": 19.0763,
            "longitude": 72.8778,
            "num_floors": 2,
        },
        {
            "name": "Gargi Plaza & Amphitheatre",
            "code": "GARG",
            "address": "Somaiya Central Plaza",
            "latitude": 19.0762,
            "longitude": 72.8768,
            "num_floors": 1,
        },
    ]

    b_map = {}
    for bd in buildings_data:
        b_res = await db.execute(select(Building).where(Building.code == bd["code"]))
        b = b_res.scalar_one_or_none()
        if not b:
            b = Building(
                name=bd["name"],
                code=bd["code"],
                address=bd["address"],
                latitude=bd["latitude"],
                longitude=bd["longitude"],
                num_floors=bd["num_floors"],
                is_accessible=True,
            )
            db.add(b)
            await db.flush()
        b_map[bd["code"]] = b

    # Floors and Rooms for SSBAS
    ssbas = b_map["SSBAS"]
    floors_map = {}
    for fn in range(1, 5):
        fl_res = await db.execute(select(Floor).where((Floor.building_id == ssbas.id) & (Floor.floor_number == fn)))
        fl = fl_res.scalar_one_or_none()
        if not fl:
            fl = Floor(building_id=ssbas.id, floor_number=fn, name=f"Floor {fn}")
            db.add(fl)
            await db.flush()
        floors_map[fn] = fl

    ssbas_rooms = [
        {"num": "101", "name": "CSB 101 Lecture Hall", "floor": 1, "cap": 60, "type": "classroom"},
        {"num": "201", "name": "CSB 201 Seminar Classroom", "floor": 2, "cap": 60, "type": "classroom"},
        {"num": "301", "name": "CSB 301 Advanced Software Lab", "floor": 3, "cap": 45, "type": "laboratory"},
        {"num": "302", "name": "CSB 302 DBMS Classroom", "floor": 3, "cap": 65, "type": "classroom"},
        {"num": "304", "name": "CSB 304 Cloud Computing Lab 3", "floor": 3, "cap": 50, "type": "laboratory"},
        {"num": "401", "name": "CSB 401 Main Auditorium", "floor": 4, "cap": 120, "type": "auditorium"},
    ]

    room_map = {}
    for rd in ssbas_rooms:
        rm_res = await db.execute(select(Room).where((Room.building_id == ssbas.id) & (Room.room_number == rd["num"])))
        rm = rm_res.scalar_one_or_none()
        if not rm:
            rm = Room(
                building_id=ssbas.id,
                floor_id=floors_map[rd["floor"]].id,
                room_number=rd["num"],
                name=rd["name"],
                capacity=rd["cap"],
                room_type=rd["type"],
                is_accessible=True,
            )
            db.add(rm)
            await db.flush()
        room_map[rd["num"]] = rm

    # Rooms for Aurobindo and Bhaskaracharya
    auro = b_map["AURO"]
    auro_rooms = [
        {"num": "201", "name": "Aurobindo 201 Classroom", "cap": 60, "type": "classroom"},
        {"num": "302", "name": "Aurobindo 302 Lecture Hall", "cap": 60, "type": "classroom"},
    ]
    for rd in auro_rooms:
        rm_res = await db.execute(select(Room).where((Room.building_id == auro.id) & (Room.room_number == rd["num"])))
        if not rm_res.scalar_one_or_none():
            db.add(Room(
                building_id=auro.id,
                room_number=rd["num"],
                name=rd["name"],
                capacity=rd["cap"],
                room_type=rd["type"],
                is_accessible=True,
            ))

    bhak = b_map["BHAK"]
    bhak_rooms = [
        {"num": "301", "name": "Bhaskaracharya 301 Classroom", "cap": 50, "type": "classroom"},
        {"num": "506", "name": "Bhaskaracharya 506 Multi-Utility Hall", "cap": 75, "type": "classroom"},
    ]
    for rd in bhak_rooms:
        rm_res = await db.execute(select(Room).where((Room.building_id == bhak.id) & (Room.room_number == rd["num"])))
        if not rm_res.scalar_one_or_none():
            db.add(Room(
                building_id=bhak.id,
                room_number=rd["num"],
                name=rd["name"],
                capacity=rd["cap"],
                room_type=rd["type"],
                is_accessible=True,
            ))
    await db.flush()

    # 5. Courses, Sections, Sessions
    courses_data = [
        {"code": "CS502", "name": "Database Management Systems", "credits": 4, "fac": faculty},
        {"code": "CS501", "name": "Java Programming", "credits": 4, "fac": rajesh_faculty},
        {"code": "CS503", "name": "Web Technologies", "credits": 3, "fac": faculty},
        {"code": "CS506", "name": "Machine Learning", "credits": 4, "fac": rajesh_faculty},
    ]

    course_map = {}
    section_map = {}
    for cd in courses_data:
        c_res = await db.execute(select(Course).where(Course.code == cd["code"]))
        c = c_res.scalar_one_or_none()
        if not c:
            c = Course(
                code=cd["code"],
                name=cd["name"],
                credits=cd["credits"],
                department_id=dept.id,
                program_id=prog.id,
            )
            db.add(c)
            await db.flush()
        course_map[cd["code"]] = c

        # CourseSection
        cs_res = await db.execute(select(CourseSection).where(
            (CourseSection.course_id == c.id) & (CourseSection.section_number == "A")
        ))
        sec = cs_res.scalar_one_or_none()
        if not sec:
            sec = CourseSection(
                course_id=c.id,
                section_number="A",
                semester="4",
                academic_year="2025-2026",
                faculty_id=cd["fac"].id,
                faculty_name=user_map["faculty@somaiya.edu"].full_name if cd["fac"].id == faculty.id else user_map["rajesh.kumar@somaiya.edu"].full_name,
            )
            db.add(sec)
            await db.flush()
        section_map[cd["code"]] = sec

    # 6. Enrollments (Connecting Students to Courses & Faculty)
    for sec in section_map.values():
        # Enroll Arjun
        enr_arjun = await db.execute(select(Enrollment).where(
            (Enrollment.student_id == student.id) & (Enrollment.course_section_id == sec.id)
        ))
        if not enr_arjun.scalar_one_or_none():
            db.add(Enrollment(
                student_id=student.id,
                course_section_id=sec.id,
                enrollment_date=datetime.utcnow().isoformat(),
                semester=sec.semester,
                academic_year=sec.academic_year,
                status="enrolled",
            ))

        # Enroll Diya
        enr_diya = await db.execute(select(Enrollment).where(
            (Enrollment.student_id == diya_student.id) & (Enrollment.course_section_id == sec.id)
        ))
        if not enr_diya.scalar_one_or_none():
            db.add(Enrollment(
                student_id=diya_student.id,
                course_section_id=sec.id,
                enrollment_date=datetime.utcnow().isoformat(),
                semester=sec.semester,
                academic_year=sec.academic_year,
                status="enrolled",
            ))
    await db.flush()

    # 7. Class Sessions
    session_configs = [
        {"code": "CS502", "room": room_map["302"], "day": "monday", "start": "14:00", "end": "15:30", "type": "lecture"},
        {"code": "CS501", "room": room_map["201"], "day": "monday", "start": "10:00", "end": "11:30", "type": "lecture"},
        {"code": "CS503", "room": room_map["301"], "day": "monday", "start": "11:30", "end": "13:00", "type": "lab"},
    ]

    session_map = {}
    for sc in session_configs:
        sec = section_map[sc["code"]]
        rm = sc["room"]
        sess_res = await db.execute(select(ClassSession).where(
            (ClassSession.course_section_id == sec.id) & (ClassSession.room_id == rm.id)
        ))
        sess = sess_res.scalar_one_or_none()
        if not sess:
            sess = ClassSession(
                course_section_id=sec.id,
                room_id=rm.id,
                faculty_id=sec.faculty_id,
                day_of_week=sc["day"],
                start_time=sc["start"],
                end_time=sc["end"],
                session_type=sc["type"],
            )
            db.add(sess)
            await db.flush()
        session_map[sc["code"]] = sess

    # 8. Student Schedules
    sched_res = await db.execute(select(StudentSchedule).where(StudentSchedule.student_id == student.id))
    if not sched_res.scalars().all():
        today = datetime.utcnow().date()
        schedules_to_add = [
            {
                "sess": session_map["CS502"],
                "day": 0,
                "start": datetime.combine(today, time(14, 0)),
                "end": datetime.combine(today, time(15, 30)),
                "code": "CS502",
                "course": "Database Management Systems",
                "faculty": "Dr. Priya Sharma",
                "room": "302",
                "building": "Computer Science Building",
                "type": "Lecture",
                "color": "bg-red-600",
            },
            {
                "sess": session_map["CS501"],
                "day": 0,
                "start": datetime.combine(today, time(10, 0)),
                "end": datetime.combine(today, time(11, 30)),
                "code": "CS501",
                "course": "Java Programming",
                "faculty": "Dr. Rajesh Kumar",
                "room": "201",
                "building": "Computer Science Building",
                "type": "Lecture",
                "color": "bg-blue-600",
            },
            {
                "sess": session_map["CS503"],
                "day": 0,
                "start": datetime.combine(today, time(11, 30)),
                "end": datetime.combine(today, time(13, 0)),
                "code": "CS503",
                "course": "Web Technologies",
                "faculty": "Dr. Priya Sharma",
                "room": "301",
                "building": "Computer Science Building",
                "type": "Laboratory",
                "color": "bg-emerald-600",
            },
        ]
        for st in schedules_to_add:
            db.add(StudentSchedule(
                id=str(uuid.uuid4()),
                student_id=student.id,
                class_session_id=st["sess"].id,
                day_of_week=st["day"],
                start_time=st["start"],
                end_time=st["end"],
                course_code=st["code"],
                course_name=st["course"],
                faculty_name=st["faculty"],
                room_number=st["room"],
                building_name=st["building"],
                session_type=st["type"],
                color=st["color"],
            ))
        await db.flush()

    # 9. Campus Locations (Unified with Building & Facility Identities)
    locations_data = [
        {"name": "Main Campus Canteen", "type": "food", "lat": 19.0763, "lon": 72.8778, "bld": b_map["CANT"]},
        {"name": "Maggi Point", "type": "food", "lat": 19.0764, "lon": 72.8777, "bld": b_map["CANT"]},
        {"name": "Frankie Corner", "type": "food", "lat": 19.0763, "lon": 72.8779, "bld": b_map["CANT"]},
        {"name": "Central Library", "type": "facility", "lat": 19.0758, "lon": 72.8772, "bld": b_map["LIB"]},
        {"name": "CSB Lab 301", "type": "building", "lat": 19.0760, "lon": 72.8770, "bld": ssbas},
        {"name": "CSB Room 302", "type": "building", "lat": 19.0760, "lon": 72.8771, "bld": ssbas},
        {"name": "Aurobindo Lift Area", "type": "building", "lat": 19.0765, "lon": 72.8775, "bld": auro},
        {"name": "Gargi Plaza", "type": "facility", "lat": 19.0762, "lon": 72.8768, "bld": b_map["GARG"]},
        {"name": "Campus Photocopy Center", "type": "facility", "lat": 19.0761, "lon": 72.8774, "bld": ssbas},
        {"name": "Sports Ground & Gymkhana", "type": "facility", "lat": 19.0752, "lon": 72.8765, "bld": b_map["GARG"]},
    ]

    loc_map = {}
    for ld in locations_data:
        loc_res = await db.execute(select(CampusLocation).where(CampusLocation.name == ld["name"]))
        loc = loc_res.scalar_one_or_none()
        if not loc:
            loc = CampusLocation(
                name=ld["name"],
                location_type=ld["type"],
                building_id=ld["bld"].id if ld.get("bld") else None,
                latitude=ld["lat"],
                longitude=ld["lon"],
                is_accessible=True,
            )
            db.add(loc)
            await db.flush()
        else:
            loc.location_type = ld["type"]
            if ld.get("bld") and not loc.building_id:
                loc.building_id = ld["bld"].id
        loc_map[ld["name"]] = loc

    # 10. Lifts & Delays
    lifts_data = [
        {"id": "lift_auro_1", "building": auro, "num": 1, "status": "working", "cap": 12, "floor": 1},
        {"id": "lift_auro_2", "building": auro, "num": 2, "status": "unavailable", "cap": 12, "floor": 2},
        {"id": "lift_ssbas_1", "building": ssbas, "num": 1, "status": "working", "cap": 16, "floor": 1},
        {"id": "lift_bhak_1", "building": bhak, "num": 1, "status": "working", "cap": 14, "floor": 1},
    ]

    for ld in lifts_data:
        l_res = await db.execute(select(Lift).where(Lift.id == ld["id"]))
        l = l_res.scalar_one_or_none()
        if not l:
            l = Lift(
                id=ld["id"],
                building_id=ld["building"].id,
                lift_number=ld["num"],
                status=ld["status"],
                capacity=ld["cap"],
                current_floor=ld["floor"],
            )
            db.add(l)
            await db.flush()
            db.add(LiftStatusRecord(
                id=f"rec_{ld['id']}",
                lift_id=l.id,
                status=ld["status"],
                crowd_level="high" if ld["status"] == "unavailable" else "low",
                reported_by="system",
                timestamp=datetime.utcnow(),
            ))

    # 11. Crowd States & Telemetry
    crowd_configs = [
        {"loc": "Main Campus Canteen", "count": 140, "cap": 160, "ratio": 0.88, "density": "high", "alert": True},
        {"loc": "Frankie Corner", "count": 42, "cap": 50, "ratio": 0.84, "density": "high", "alert": True},
        {"loc": "Maggi Point", "count": 28, "cap": 50, "ratio": 0.56, "density": "moderate", "alert": False},
        {"loc": "Central Library", "count": 35, "cap": 150, "ratio": 0.23, "density": "low", "alert": False},
        {"loc": "CSB Lab 301", "count": 27, "cap": 45, "ratio": 0.60, "density": "moderate", "alert": False},
        {"loc": "CSB Room 302", "count": 52, "cap": 65, "ratio": 0.80, "density": "moderate", "alert": False},
        {"loc": "Aurobindo Lift Area", "count": 32, "cap": 40, "ratio": 0.80, "density": "moderate", "alert": True},
        {"loc": "Gargi Plaza", "count": 45, "cap": 250, "ratio": 0.18, "density": "low", "alert": False},
    ]

    for cc in crowd_configs:
        loc = loc_map.get(cc["loc"])
        if loc:
            cs_res = await db.execute(select(CrowdState).where(CrowdState.location_id == loc.id))
            cs = cs_res.scalar_one_or_none()
            now_str = datetime.utcnow().isoformat()
            if not cs:
                cs = CrowdState(
                    location_id=loc.id,
                    current_count=cc["count"],
                    capacity=cc["cap"],
                    occupancy_ratio=cc["ratio"],
                    density_level=cc["density"],
                    trend="increasing" if cc["density"] == "high" else "stable",
                    is_alert=cc["alert"],
                    last_updated=now_str,
                )
                db.add(cs)
            else:
                cs.current_count = cc["count"]
                cs.capacity = cc["cap"]
                cs.occupancy_ratio = cc["ratio"]
                cs.density_level = cc["density"]
                cs.is_alert = cc["alert"]
                cs.last_updated = now_str

    # 12. Library Books
    books_data = [
        {
            "id": "book-dbms-korth",
            "title": "Database System Concepts",
            "author": "Silberschatz, Korth, Sudarshan",
            "isbn": "978-0078022159",
            "subject": "Database Management",
            "shelf": "CS-04-A",
            "total": 5,
            "avail": 3,
        },
        {
            "id": "book-os-galvin",
            "title": "Operating System Concepts",
            "author": "Silberschatz, Galvin, Gagne",
            "isbn": "978-1119800361",
            "subject": "Operating Systems",
            "shelf": "CS-03-B",
            "total": 4,
            "avail": 2,
        },
        {
            "id": "book-algo-clrs",
            "title": "Introduction to Algorithms",
            "author": "Cormen, Leiserson, Rivest, Stein",
            "isbn": "978-0262046305",
            "subject": "Data Structures & Algorithms",
            "shelf": "CS-01-A",
            "total": 6,
            "avail": 4,
        },
        {
            "id": "book-net-tanenbaum",
            "title": "Computer Networks",
            "author": "Andrew S. Tanenbaum, David J. Wetherall",
            "isbn": "978-0132126953",
            "subject": "Networking",
            "shelf": "CS-05-C",
            "total": 4,
            "avail": 2,
        },
        {
            "id": "book-ai-russell",
            "title": "Artificial Intelligence: A Modern Approach",
            "author": "Stuart Russell, Peter Norvig",
            "isbn": "978-0134610993",
            "subject": "Artificial Intelligence",
            "shelf": "AI-02-A",
            "total": 5,
            "avail": 4,
        },
    ]

    for bd in books_data:
        bk_res = await db.execute(select(LibraryBook).where(LibraryBook.id == bd["id"]))
        bk = bk_res.scalar_one_or_none()
        if not bk:
            bk = LibraryBook(
                id=bd["id"],
                title=bd["title"],
                author=bd["author"],
                isbn=bd["isbn"],
                subject=bd["subject"],
                department="Computer Applications",
                shelf_location=bd["shelf"],
                total_copies=bd["total"],
                available_copies=bd["avail"],
            )
            db.add(bk)
            await db.flush()
            for cp in range(1, bd["total"] + 1):
                is_borrowed = cp > bd["avail"]
                db.add(LibraryBookCopy(
                    book_id=bk.id,
                    copy_number=cp,
                    status="borrowed" if is_borrowed else "available",
                    borrower_id=student_user.id if is_borrowed else None,
                ))

    # 13. Events
    ev_res = await db.execute(select(Event))
    if not ev_res.scalars().all():
        loc_gargi = loc_map.get("Gargi Plaza")
        loc_id = loc_gargi.id if loc_gargi else 1
        events_data = [
            {
                "id": "evt_hackathon_2026",
                "title": "Somaiya Annual Hackathon 2026",
                "desc": "36-Hour National Campus Hackathon organized by K. J. Somaiya College of Engineering.",
                "type": "hackathon",
                "loc": loc_id,
                "organizer": "Student Activity Council",
                "max": 250,
                "reg": 182,
                "status": "upcoming",
                "start": datetime.utcnow() + timedelta(days=2),
                "end": datetime.utcnow() + timedelta(days=4),
            },
            {
                "id": "evt_ai_symposium",
                "title": "AI & Digital Twin Symposium",
                "desc": "Industry keynote and student demonstrations on spatial campus computing and smart infrastructure.",
                "type": "seminar",
                "loc": loc_id,
                "organizer": "Department of Computer Applications",
                "max": 150,
                "reg": 115,
                "status": "upcoming",
                "start": datetime.utcnow() + timedelta(days=5),
                "end": datetime.utcnow() + timedelta(days=5, hours=4),
            },
        ]
        for ed in events_data:
            db.add(Event(
                id=ed["id"],
                title=ed["title"],
                description=ed["desc"],
                event_type=ed["type"],
                location_id=ed["loc"],
                organizer=ed["organizer"],
                max_participants=ed["max"],
                registrations=ed["reg"],
                status=ed["status"],
                start_time=ed["start"],
                end_time=ed["end"],
            ))

    # 14. Notifications
    notif_res = await db.execute(select(Notification).where(Notification.recipient_id == student_user.id))
    if not notif_res.scalars().all():
        notifications_data = [
            {
                "id": "notif_001",
                "event": "Leave Now for Next Lecture",
                "reason": "Your DBMS lecture starts at 2:00 PM in CSB 302. Walking ETA is 14 minutes due to lift delay.",
                "priority": "high",
            },
            {
                "id": "notif_002",
                "event": "Elevator Outage Alert",
                "reason": "Aurobindo Elevator 2 is under maintenance. Please use the central staircase or Elevator 1.",
                "priority": "warning",
            },
            {
                "id": "notif_003",
                "event": "Library Book Available",
                "reason": "'Database System Concepts (Silberschatz)' has 3 copies available at shelf CS-04-A.",
                "priority": "info",
            },
        ]
        for nd in notifications_data:
            db.add(Notification(
                id=nd["id"],
                recipient_id=student_user.id,
                event=nd["event"],
                reason=nd["reason"],
                priority=nd["priority"],
                read=False,
            ))

    await db.commit()
    logger.info("Core Somaiya campus data seeded and verified successfully.")
