#!/usr/bin/env python3
"""Campus NEXUS Comprehensive Deterministic Demo Data Seeder.

Creates realistic production-quality demo data for Somaiya Vidyavihar University:
- Student, Faculty, and Admin accounts
- Buildings (SSBAS, Aurobindo, Bhaskaracharya, Gargi Plaza, Central Library, Canteen)
- Floors, Classrooms, and Laboratories
- Courses, Course Sections, Class Sessions, Student & Faculty Timetables
- Library Catalog (Books, Copies, Seats, Occupancy)
- Learning Resources (Notes, Videos, Practice Sets)
- Campus Pulse & Locations (Canteen, Frankie, Maggi Point, Library, Labs, Lifts)
- Elevator Telemetry (Aurobindo Lift 2 unavailable to drive realistic delay navigation)
- Infrastructure Issues & Lost/Found Items
- Campus Events
"""

import asyncio
import sys
from datetime import datetime, timedelta, time
from pathlib import Path
import uuid

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.database import async_session_factory, engine, Base
from app.core.security import hash_password
from app.models import (
    User, Student, Faculty, Admin, Department, Program, Course, CourseSection,
    ClassSession, Building, Floor, Room, CampusLocation,
    Lift, LiftStatusRecord, StudentSchedule, Enrollment,
    CrowdReport, CrowdState, BuzzPost, Issue, LostItem, FoundItem,
    Event, Notification, LibraryBook, LibraryBookCopy,
    LibrarySeat, LearningResource
)
from sqlalchemy.future import select


async def seed_demo_data():
    print("=== Starting Somaiya Campus NEXUS Data Seeder ===")
    
    async with async_session_factory() as db:
        # 1. Users
        print("Seeding Users...")
        demo_users = [
            {
                "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
                "email": "student@somaiya.edu",
                "full_name": "Arjun Mehta",
                "role": "student",
            },
            {
                "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
                "email": "faculty@somaiya.edu",
                "full_name": "Dr. Priya Sharma",
                "role": "faculty",
            },
            {
                "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
                "email": "admin@somaiya.edu",
                "full_name": "Campus Administrator",
                "role": "admin",
            },
            {
                "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
                "email": "diya.shah@somaiya.edu",
                "full_name": "Diya Shah",
                "role": "student",
            },
            {
                "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
                "email": "rajesh.kumar@somaiya.edu",
                "full_name": "Dr. Rajesh Kumar",
                "role": "faculty",
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
                existing.hashed_password = hash_password("demo123")
                existing.is_active = True
            await db.flush()
            user_map[u["email"]] = existing

        # 2. Departments & Programs
        print("Seeding Departments & Programs...")
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
            )
            db.add(student)

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
            )
            db.add(faculty)

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
        print("Seeding Buildings, Floors, and Rooms...")
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
        for fn in range(1, 5):
            fl_res = await db.execute(select(Floor).where((Floor.building_id == auro.id) & (Floor.floor_number == fn)))
            if not fl_res.scalar_one_or_none():
                db.add(Floor(building_id=auro.id, floor_number=fn, name=f"Aurobindo Floor {fn}"))
        await db.flush()

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
        for fn in range(1, 6):
            fl_res = await db.execute(select(Floor).where((Floor.building_id == bhak.id) & (Floor.floor_number == fn)))
            if not fl_res.scalar_one_or_none():
                db.add(Floor(building_id=bhak.id, floor_number=fn, name=f"Bhaskar Floor {fn}"))
        await db.flush()

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
        print("Seeding Courses & Class Sessions...")
        courses_data = [
            {"code": "CS502", "name": "Database Management Systems", "credits": 4},
            {"code": "CS501", "name": "Java Programming", "credits": 4},
            {"code": "CS503", "name": "Web Technologies", "credits": 3},
            {"code": "CS506", "name": "Machine Learning", "credits": 4},
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
                    faculty_id=faculty.id,
                    faculty_name="Dr. Priya Sharma",
                )
                db.add(sec)
                await db.flush()
            section_map[cd["code"]] = sec

        # Enrollments
        print("Seeding Enrollments...")
        for sec in section_map.values():
            existing_enr = await db.execute(select(Enrollment).where(
                (Enrollment.student_id == student.id) & (Enrollment.course_section_id == sec.id)
            ))
            if not existing_enr.scalar_one_or_none():
                db.add(Enrollment(
                    student_id=student.id,
                    course_section_id=sec.id,
                    enrollment_date=datetime.utcnow().isoformat(),
                    semester=sec.semester,
                    academic_year=sec.academic_year,
                    status="enrolled",
                ))
        await db.flush()

        # Class Sessions
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
                    faculty_id=faculty.id,
                    day_of_week=sc["day"],
                    start_time=sc["start"],
                    end_time=sc["end"],
                    session_type=sc["type"],
                )
                db.add(sess)
                await db.flush()
            session_map[sc["code"]] = sess

        # 6. Student Schedules
        print("Seeding Student Schedules...")
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
                    "faculty": "Prof. Amit Singh",
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

        # 7. Campus Locations
        print("Seeding Campus Locations...")
        locations_data = [
            {"name": "Main Campus Canteen", "type": "cafeteria", "lat": 19.0763, "lon": 72.8778},
            {"name": "Maggi Point", "type": "food_stall", "lat": 19.0764, "lon": 72.8777},
            {"name": "Frankie Corner", "type": "food_stall", "lat": 19.0763, "lon": 72.8779},
            {"name": "Central Library", "type": "library", "lat": 19.0758, "lon": 72.8772},
            {"name": "CSB Lab 301", "type": "laboratory", "lat": 19.0760, "lon": 72.8770},
            {"name": "CSB Room 302", "type": "classroom", "lat": 19.0760, "lon": 72.8771},
            {"name": "Aurobindo Lift Area", "type": "corridor", "lat": 19.0765, "lon": 72.8775},
            {"name": "Gargi Plaza", "type": "plaza", "lat": 19.0762, "lon": 72.8768},
            {"name": "Campus Photocopy Center", "type": "service", "lat": 19.0761, "lon": 72.8774},
            {"name": "Sports Ground & Gymkhana", "type": "sports", "lat": 19.0752, "lon": 72.8765},
        ]

        loc_map = {}
        for ld in locations_data:
            loc_res = await db.execute(select(CampusLocation).where(CampusLocation.name == ld["name"]))
            loc = loc_res.scalar_one_or_none()
            if not loc:
                loc = CampusLocation(
                    name=ld["name"],
                    location_type=ld["type"],
                    latitude=ld["lat"],
                    longitude=ld["lon"],
                    is_accessible=True,
                )
                db.add(loc)
                await db.flush()
            loc_map[ld["name"]] = loc

        # 8. Lifts & Elevator Delays
        print("Seeding Lifts & Telemetry...")
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
        await db.flush()

        # 9. Crowd States & Pulse
        print("Seeding Crowd States & Pulse...")
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
                
                db.add(CrowdReport(
                    location_id=loc.id,
                    reported_by_user_id=student_user.id,
                    count=cc["count"],
                    capacity=cc["cap"],
                    density_level=cc["density"],
                    confidence_score=0.92,
                    is_verified=True,
                    reported_at=now_str,
                ))
        await db.flush()

        # 10. NEXUS Buzz
        print("Seeding NEXUS Buzz...")
        buzz_res = await db.execute(select(BuzzPost))
        if not buzz_res.scalars().all():
            buzz_items = [
                {
                    "loc": "Main Campus Canteen",
                    "title": "Canteen Rush Alert",
                    "text": "Heavy rush at the Frankie counter! Wait time is approx 12-15 mins. Maggi point line is moving much faster.",
                },
                {
                    "loc": "Central Library",
                    "title": "Quiet Zone Available",
                    "text": "2nd floor quiet reading hall is cool and empty. Perfect spot for study before the 2 PM DBMS lecture.",
                },
                {
                    "loc": "Aurobindo Lift Area",
                    "title": "Elevator Maintenance Notice",
                    "text": "Aurobindo Lift 2 is undergoing door sensor maintenance. Use the central stairs to reach 3rd floor quickly.",
                },
            ]
            for b in buzz_items:
                loc = loc_map.get(b["loc"])
                if loc:
                    db.add(BuzzPost(
                        location_id=loc.id,
                        user_id=student_user.id,
                        title=b["title"],
                        content=b["text"],
                        likes_count=14,
                    ))
            await db.flush()

        # 11. Library Books & Seats
        print("Seeding Library Books & Seats...")
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
                "avail": 1,
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
            {
                "id": "book-arch-martin",
                "title": "Clean Architecture: A Craftsman's Guide",
                "author": "Robert C. Martin",
                "isbn": "978-0134494166",
                "subject": "Software Engineering",
                "shelf": "SE-01-D",
                "total": 3,
                "avail": 2,
            },
            {
                "id": "book-ddia-kleppmann",
                "title": "Designing Data-Intensive Applications",
                "author": "Martin Kleppmann",
                "isbn": "978-1449373320",
                "subject": "Distributed Systems",
                "shelf": "CS-06-B",
                "total": 4,
                "avail": 3,
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

        seat_res = await db.execute(select(LibrarySeat))
        if not seat_res.scalars().all():
            for s_num in range(1, 41):
                db.add(LibrarySeat(
                    id=f"seat_{s_num}",
                    seat_number=f"S-{s_num:02d}",
                    zone="silent" if s_num <= 20 else "reading_hall",
                    is_occupied=(s_num % 4 == 0),
                ))
        await db.flush()

        # 12. Learning Resources
        print("Seeding Academic Learning Resources...")
        lr_res = await db.execute(select(LearningResource))
        if not lr_res.scalars().all():
            resources = [
                {
                    "title": "Relational Database Normalization Masterclass",
                    "desc": "Step-by-step breakdown of 1NF, 2NF, 3NF, BCNF with university past-paper solutions.",
                    "type": "video",
                    "course": "CS502",
                    "module": "Relational Database Design",
                    "topic": "Normalization",
                    "duration": 42,
                    "url": "https://somaiya.edu/resources/cs502/normalization-lecture",
                },
                {
                    "title": "SQL Query Optimization & Index Tuning Cheatsheet",
                    "desc": "B-Tree indexes, execution plans, clustered vs non-clustered indexes reference guide.",
                    "type": "notes",
                    "course": "CS502",
                    "module": "Query Processing",
                    "topic": "Indexing",
                    "duration": 20,
                    "url": "https://somaiya.edu/resources/cs502/indexing-cheatsheet.pdf",
                },
                {
                    "title": "Java Concurrency & Multi-Threading Deep Dive",
                    "desc": "Thread pools, synchronized blocks, and java.util.concurrent concurrent data structures.",
                    "type": "tutorial",
                    "course": "CS501",
                    "module": "Advanced Java",
                    "topic": "Concurrency",
                    "duration": 35,
                    "url": "https://somaiya.edu/resources/cs501/concurrency-tutorial",
                },
                {
                    "title": "Full-Stack RESTful API Architecture with Next.js & FastAPI",
                    "desc": "Architecting clean APIs, JWT authorization, and WebSocket state synchronization.",
                    "type": "practice_set",
                    "course": "CS503",
                    "module": "Web Engineering",
                    "topic": "REST APIs",
                    "duration": 50,
                    "url": "https://somaiya.edu/resources/cs503/api-lab-guide",
                },
            ]
            for r in resources:
                db.add(LearningResource(
                    title=r["title"],
                    description=r["desc"],
                    type=r["type"],
                    course_id=r["course"],
                    module_name=r["module"],
                    topic=r["topic"],
                    difficulty="intermediate",
                    duration_minutes=r["duration"],
                    url=r["url"],
                    author_faculty_id=faculty_user.id,
                    is_verified=True,
                    rating=4.9,
                    rating_count=38,
                ))
            await db.flush()

        # 13. Issues
        print("Seeding Campus Issues...")
        iss_res = await db.execute(select(Issue))
        if not iss_res.scalars().all():
            sample_issues = [
                {
                    "id": "iss_lift_auro_02",
                    "title": "Aurobindo Lift 2 Door Sensor Fault",
                    "cat": "lift",
                    "loc": "Aurobindo Lift Area",
                    "desc": "Elevator door sensor trigger fails repeatedly on 2nd floor landing; technician requested.",
                    "prio": "high",
                    "status": "in_progress",
                    "reports": 8,
                },
                {
                    "id": "iss_proj_csb_301",
                    "title": "CSB 301 Projector HDMI Port Intermittent",
                    "cat": "projector",
                    "loc": "CSB Lab 301",
                    "desc": "Ceiling mounted projector flickers when connected via podium HDMI input cable.",
                    "prio": "medium",
                    "status": "open",
                    "reports": 3,
                },
                {
                    "id": "iss_wifi_lib_02",
                    "title": "Central Library 2nd Floor High Latency",
                    "cat": "wifi",
                    "loc": "Central Library",
                    "desc": "Students experiencing periodic connection drops on SVU-Secure Wi-Fi SSID in the west study wing.",
                    "prio": "low",
                    "status": "acknowledged",
                    "reports": 12,
                },
            ]
            for si in sample_issues:
                loc = loc_map.get(si["loc"])
                if loc:
                    db.add(Issue(
                        id=si["id"],
                        title=si["title"],
                        category=si["cat"],
                        location_id=loc.id,
                        description=si["desc"],
                        priority=si["prio"],
                        status=si["status"],
                        report_count=si["reports"],
                        confidence=0.95,
                        assigned_to=admin_user.id,
                        created_at=datetime.utcnow() - timedelta(hours=3),
                    ))
            await db.flush()

        # 14. Lost & Found Items
        print("Seeding Lost & Found Items...")
        lf_res = await db.execute(select(LostItem))
        if not lf_res.scalars().all():
            db.add(LostItem(
                description="Black 65W USB-C Laptop Charger left near CSB Lab 301 desk 14",
                category="electronics",
                name="Lenovo 65W USB-C Charger",
                color="Black",
                brand="Lenovo",
                building_id=ssbas.id,
                reported_by_user_id=student_user.id,
                reported_at="2026-09-03 11:30",
                last_seen_at="CSB Lab 301 Desk 14",
                status="reported",
                is_anonymous=False,
                contact_info="arjun.mehta@somaiya.edu",
            ))
            db.add(FoundItem(
                description="Silver Titan Analog Watch found on Gargi Plaza amphitheatre steps",
                category="accessories",
                name="Titan Silver Wristwatch",
                color="Silver",
                brand="Titan",
                building_id=b_map["GARG"].id,
                found_by_user_id=user_map["diya.shah@somaiya.edu"].id,
                found_at="2026-09-03 13:00",
                status="unclaimed",
                is_anonymous=False,
                contact_info="Submitted to Security Gate 1",
            ))
            await db.flush()

        # 15. Events
        print("Seeding Campus Events...")
        ev_res = await db.execute(select(Event))
        if not ev_res.scalars().all():
            loc_gargi = loc_map["Gargi Plaza"]
            events_data = [
                {
                    "id": "evt_hackathon_2026",
                    "title": "Somaiya Annual Hackathon 2026",
                    "desc": "36-Hour National Campus Hackathon organized by K. J. Somaiya College of Engineering.",
                    "type": "hackathon",
                    "loc": loc_gargi.id,
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
                    "loc": loc_gargi.id,
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
            await db.flush()

        # 16. Notifications
        print("Seeding Notifications...")
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
        print("\n[SUCCESS] All Somaiya Vidyavihar campus demo data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
