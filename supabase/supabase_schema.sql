-- Campus NEXUS Supabase Schema
-- Generated from actual SQLAlchemy models and live database inspection.
-- This represents the single source of truth for Supabase deployment.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- USERS & AUTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'admin', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    profile_image_url VARCHAR(512),
    department_id INTEGER,
    faculty_id INTEGER,
    student_id INTEGER,
    last_login_at VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    event_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    library_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    issue_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    schedule_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- ACADEMIC
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    description TEXT,
    head_of_department_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    duration_years INTEGER NOT NULL,
    total_credits INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    prerequisites TEXT,
    learning_outcomes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_programs (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    is_core BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, program_id)
);

CREATE TABLE IF NOT EXISTS course_sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    section_code VARCHAR(32) NOT NULL,
    faculty_id UUID NOT NULL REFERENCES users(id),
    max_capacity INTEGER NOT NULL,
    current_enrollment INTEGER NOT NULL DEFAULT 0,
    semester VARCHAR(32) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    room_id INTEGER,
    timetable_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, section_code, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_section_id INTEGER NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed', 'failed')),
    grade VARCHAR(8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_section_id)
);

CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(16) NOT NULL,
    semester VARCHAR(32) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable_entries (
    id SERIAL PRIMARY KEY,
    timetable_id INTEGER NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    course_section_id INTEGER NOT NULL REFERENCES course_sections(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_section_id INTEGER NOT NULL REFERENCES course_sections(id),
    topic VARCHAR(255),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INTEGER,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_section_id INTEGER NOT NULL REFERENCES course_sections(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_section_id)
);

CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    booked_by_user_id UUID NOT NULL REFERENCES users(id),
    purpose VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CAMPUS INFRASTRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    num_floors INTEGER,
    description TEXT,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name VARCHAR(128),
    description TEXT,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(building_id, floor_number)
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id INTEGER REFERENCES floors(id),
    room_number VARCHAR(32) NOT NULL,
    name VARCHAR(255),
    capacity INTEGER NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    room_type VARCHAR(32) NOT NULL DEFAULT 'classroom' CHECK (room_type IN ('classroom', 'laboratory', 'seminar_hall', 'office', 'other')),
    area_sqft DOUBLE PRECISION,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(building_id, room_number)
);

CREATE TABLE IF NOT EXISTS classrooms (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    has_projector BOOLEAN NOT NULL DEFAULT FALSE,
    has_whiteboard BOOLEAN NOT NULL DEFAULT TRUE,
    has_audio_system BOOLEAN NOT NULL DEFAULT FALSE,
    has_video_conference BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS laboratories (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
    lab_type VARCHAR(128) NOT NULL,
    equipment JSONB,
    safety_equipment JSONB,
    max_capacity INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(64) NOT NULL,
    building_id INTEGER REFERENCES buildings(id),
    floor_id INTEGER REFERENCES floors(id),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geometry GEOMETRY(Point, 4326),
    capacity INTEGER,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(64) NOT NULL,
    location_id INTEGER NOT NULL REFERENCES campus_locations(id),
    capacity INTEGER,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    features JSONB,
    operating_hours JSONB,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifts (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id),
    lift_number INTEGER NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'operational',
    current_floor INTEGER NOT NULL DEFAULT 1,
    direction VARCHAR(32) NOT NULL DEFAULT 'idle',
    capacity INTEGER NOT NULL DEFAULT 8,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(building_id, lift_number)
);

CREATE TABLE IF NOT EXISTS lift_status_records (
    id SERIAL PRIMARY KEY,
    lift_id INTEGER NOT NULL REFERENCES lifts(id) ON DELETE CASCADE,
    status VARCHAR(64) NOT NULL,
    current_floor INTEGER,
    direction VARCHAR(32) NOT NULL DEFAULT 'idle',
    is_operational BOOLEAN NOT NULL DEFAULT TRUE,
    is_door_open BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(128) NOT NULL,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    serial_number VARCHAR(128),
    status VARCHAR(64) NOT NULL DEFAULT 'operational',
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(128) NOT NULL,
    url VARCHAR(512),
    file_path VARCHAR(512),
    course_id INTEGER REFERENCES courses(id),
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CAMPUS INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crowd_reports (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES campus_locations(id),
    room_id INTEGER REFERENCES rooms(id),
    building_id INTEGER REFERENCES buildings(id),
    reported_by_user_id UUID REFERENCES users(id),
    count INTEGER NOT NULL,
    capacity INTEGER,
    density_level VARCHAR(64) NOT NULL,
    confidence_score DOUBLE PRECISION,
    source VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'sensor', 'camera', 'wifi', 'manual')),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crowd_states (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES campus_locations(id),
    current_count INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER,
    occupancy_ratio DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    density_level VARCHAR(64) NOT NULL DEFAULT 'moderate',
    is_alert BOOLEAN NOT NULL DEFAULT FALSE,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(location_id)
);

CREATE TABLE IF NOT EXISTS buzz_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    location_id INTEGER REFERENCES campus_locations(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    visibility VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(128),
    location_id INTEGER NOT NULL,
    description TEXT,
    priority VARCHAR(32) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(32) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    report_count INTEGER NOT NULL DEFAULT 1,
    confidence DOUBLE PRECISION,
    cluster_id INTEGER,
    assigned_to UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id VARCHAR(128) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id),
    description TEXT NOT NULL,
    image_url VARCHAR(512),
    contact_info VARCHAR(512),
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_clusters (
    id SERIAL PRIMARY KEY,
    category VARCHAR(128) NOT NULL,
    location_id INTEGER NOT NULL,
    issue_count INTEGER NOT NULL DEFAULT 0,
    representative_issue_id VARCHAR(128) REFERENCES issues(id),
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_items (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    color VARCHAR(64),
    brand VARCHAR(128),
    location_id INTEGER REFERENCES campus_locations(id),
    room_id INTEGER REFERENCES rooms(id),
    building_id INTEGER REFERENCES buildings(id),
    reported_by_user_id UUID NOT NULL REFERENCES users(id),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'lost' CHECK (status IN ('lost', 'found', 'claimed', 'archived')),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    contact_info VARCHAR(512),
    reward_offered BOOLEAN NOT NULL DEFAULT FALSE,
    reward_amount INTEGER,
    image_url VARCHAR(512),
    match_confidence DOUBLE PRECISION,
    matched_found_item_id INTEGER REFERENCES found_items(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS found_items (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    color VARCHAR(64),
    brand VARCHAR(128),
    location_id INTEGER REFERENCES campus_locations(id),
    room_id INTEGER REFERENCES rooms(id),
    building_id INTEGER REFERENCES buildings(id),
    found_by_user_id UUID NOT NULL REFERENCES users(id),
    found_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'returned')),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    contact_info VARCHAR(512),
    image_url VARCHAR(512),
    claimed_by_user_id UUID REFERENCES users(id),
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_found_matches (
    id SERIAL PRIMARY KEY,
    lost_item_id INTEGER NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
    found_item_id INTEGER NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
    confidence_score DOUBLE PRECISION NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    match_reason TEXT,
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    claimed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EVENTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(64),
    location_id INTEGER NOT NULL REFERENCES campus_locations(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    organizer VARCHAR(255),
    max_participants INTEGER,
    registrations INTEGER NOT NULL DEFAULT 0,
    crowd_estimate VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url VARCHAR(512),
    registration_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(128) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registration_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(128) PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event VARCHAR(128) NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(32) NOT NULL DEFAULT 'medium',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS library_books (
    id VARCHAR(128) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(64),
    edition VARCHAR(64),
    publisher VARCHAR(255),
    publication_year INTEGER,
    subject VARCHAR(255),
    department VARCHAR(255),
    shelf_location VARCHAR(255),
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id VARCHAR(128) NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'reserved', 'lost', 'damaged')),
    condition VARCHAR(32) NOT NULL DEFAULT 'good',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(book_id, copy_number)
);

CREATE TABLE IF NOT EXISTS library_reservations (
    id VARCHAR(128) PRIMARY KEY,
    book_id VARCHAR(128) NOT NULL REFERENCES library_books(id),
    student_id UUID NOT NULL REFERENCES users(id),
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready_for_pickup', 'picked_up', 'cancelled', 'expired')),
    pickup_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS library_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id INTEGER REFERENCES campus_locations(id),
    seat_number VARCHAR(64) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    features JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STUDENT / FACULTY PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    student_id_number VARCHAR(64) UNIQUE NOT NULL,
    enrollment_date VARCHAR(64) NOT NULL,
    graduation_date VARCHAR(64),
    program_id INTEGER REFERENCES programs(id),
    department_id INTEGER REFERENCES departments(id),
    academic_year VARCHAR(16) NOT NULL,
    current_semester INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended')),
    cgpa VARCHAR(16),
    total_credits INTEGER NOT NULL DEFAULT 0,
    is_hostelite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    bio VARCHAR(1000),
    portfolio_json TEXT
);

CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id_number VARCHAR(64) UNIQUE NOT NULL,
    designation VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    join_date VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'retired')),
    is_hod BOOLEAN NOT NULL DEFAULT FALSE,
    office_location VARCHAR(255),
    qualification VARCHAR(255),
    experience_years INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    office_hours_summary VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    role_level VARCHAR(64) NOT NULL DEFAULT 'admin',
    permissions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty_availability (
    id VARCHAR(128) PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EMERGENCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(32),
    reporter_role VARCHAR(64) DEFAULT 'student',
    emergency_type VARCHAR(64) NOT NULL,
    severity VARCHAR(64) NOT NULL DEFAULT 'HIGH',
    location_name VARCHAR(255) NOT NULL,
    building_id INTEGER REFERENCES buildings(id),
    coordinates VARCHAR(255),
    description TEXT NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'REPORTED',
    assigned_responder VARCHAR(255),
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PRESENCE / LOCATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS presence_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    privacy_mode VARCHAR(64) NOT NULL DEFAULT 'APPROXIMATE',
    current_building_id INTEGER REFERENCES buildings(id),
    current_floor_id INTEGER REFERENCES floors(id),
    current_room_id VARCHAR(64),
    current_zone VARCHAR(255),
    last_seen_at TIMESTAMPTZ,
    share_with_friends BOOLEAN NOT NULL DEFAULT FALSE,
    share_with_faculty BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- DIGITAL TWIN STATE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campus_state (
    id SERIAL PRIMARY KEY,
    state_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    buildings JSONB NOT NULL DEFAULT '[]'::jsonb,
    rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
    crowd JSONB NOT NULL DEFAULT '{}'::jsonb,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    lifts JSONB NOT NULL DEFAULT '[]'::jsonb,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LEARNING RESOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(128) NOT NULL,
    url VARCHAR(512),
    file_path VARCHAR(512),
    course_id INTEGER REFERENCES courses(id),
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS faq_entries (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(128),
    tags TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(128),
    tags TEXT[],
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SIMULATION / OPTIMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(128) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES simulation_scenarios(id),
    result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optimization_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    optimization_type VARCHAR(128) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS optimization_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    result_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM / AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(128),
    resource_id VARCHAR(128),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    status VARCHAR(64) NOT NULL DEFAULT 'running',
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    tool_name VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(64) NOT NULL DEFAULT 'success',
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RESERVATIONS (generic)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id INTEGER REFERENCES resources(id),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_faculties_user_id ON faculties(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_code ON buildings(code);
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_campus_locations_building_id ON campus_locations(building_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_location_id ON issues(location_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_student_id ON library_reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_book_id ON library_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_severity ON emergency_reports(severity);
CREATE INDEX IF NOT EXISTS idx_presence_consent_user_id ON presence_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_consent_enabled ON presence_consent(is_enabled);
CREATE INDEX IF NOT EXISTS idx_faculty_availability_faculty_id ON faculty_availability(faculty_id);
CREATE INDEX IF NOT EXISTS idx_crowd_reports_location_id ON crowd_reports(location_id);
CREATE INDEX IF NOT EXISTS idx_crowd_states_location_id ON crowd_states(location_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_lost_items_reported_by ON lost_items(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_found_items_found_by ON found_items(found_by_user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_section_id ON enrollments(course_section_id);
