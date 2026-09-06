-- Campus NEXUS Row Level Security Policies
-- Generated for Supabase deployment with role-based access control.

-- ============================================================================
-- ROLE DEFINITIONS (Supabase Auth)
-- ============================================================================

-- Note: In Supabase, roles are typically mapped via:
--   authenticated  -> any logged-in user
--   student        -> users with role = 'student'
--   faculty        -> users with role = 'faculty'
--   admin          -> users with role = 'admin'
--   service_role   -> backend/server-side operations
--   anon           -> unauthenticated users (minimal read access)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('jwt.claims', true)::json->>'sub'
    )::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'role',
        current_setting('jwt.claims', true)::json->>'role'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lift_status_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzz_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS
-- ============================================================================

DROP POLICY IF EXISTS users_read_self ON users;
CREATE POLICY users_read_self ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS users_update_self ON users;
CREATE POLICY users_update_self ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS users_admin_all ON users;
CREATE POLICY users_admin_all ON users
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- STUDENTS
-- ============================================================================

DROP POLICY IF EXISTS students_read_self ON students;
CREATE POLICY students_read_self ON students
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR auth.role() IN ('admin', 'super_admin')
        OR auth.role() = 'faculty'
    );

DROP POLICY IF EXISTS students_update_self ON students;
CREATE POLICY students_update_self ON students
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS students_admin_all ON students;
CREATE POLICY students_admin_all ON students
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- FACULTIES
-- ============================================================================

DROP POLICY IF EXISTS faculties_read_public ON faculties;
CREATE POLICY faculties_read_public ON faculties
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS faculties_update_self ON faculties;
CREATE POLICY faculties_update_self ON faculties
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS faculties_admin_all ON faculties;
CREATE POLICY faculties_admin_all ON faculties
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- ADMINS
-- ============================================================================

DROP POLICY IF EXISTS admins_read_admin ON admins;
CREATE POLICY admins_read_admin ON admins
    FOR SELECT TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS admins_admin_all ON admins;
CREATE POLICY admins_admin_all ON admins
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- BUILDINGS / ROOMS / CAMPUS LOCATIONS
-- ============================================================================

DROP POLICY IF EXISTS buildings_read_all ON buildings;
CREATE POLICY buildings_read_all ON buildings
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS buildings_admin_write ON buildings;
CREATE POLICY buildings_admin_write ON buildings
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS buildings_admin_update ON buildings;
CREATE POLICY buildings_admin_update ON buildings
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS buildings_admin_delete ON buildings;
CREATE POLICY buildings_admin_delete ON buildings
    FOR DELETE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS floors_read_all ON floors;
CREATE POLICY floors_read_all ON floors
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rooms_read_all ON rooms;
CREATE POLICY rooms_read_all ON rooms
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS rooms_admin_write ON rooms;
CREATE POLICY rooms_admin_write ON rooms
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS rooms_admin_update ON rooms;
CREATE POLICY rooms_admin_update ON rooms
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS campus_locations_read_all ON campus_locations;
CREATE POLICY campus_locations_read_all ON campus_locations
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS campus_locations_admin_write ON campus_locations;
CREATE POLICY campus_locations_admin_write ON campus_locations
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS campus_locations_admin_update ON campus_locations;
CREATE POLICY campus_locations_admin_update ON campus_locations
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- EVENTS
-- ============================================================================

DROP POLICY IF EXISTS events_read_all ON events;
CREATE POLICY events_read_all ON events
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS events_admin_write ON events;
CREATE POLICY events_admin_write ON events
    FOR INSERT TO authenticated
    WITH CHECK (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS events_admin_update ON events;
CREATE POLICY events_admin_update ON events
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS events_admin_delete ON events;
CREATE POLICY events_admin_delete ON events
    FOR DELETE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- EVENT REGISTRATIONS
-- ============================================================================

DROP POLICY IF EXISTS event_registrations_read_own ON event_registrations;
CREATE POLICY event_registrations_read_own ON event_registrations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS event_registrations_insert_own ON event_registrations;
CREATE POLICY event_registrations_insert_own ON event_registrations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS event_registrations_update_own ON event_registrations;
CREATE POLICY event_registrations_update_own ON event_registrations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS notifications_read_own ON notifications;
CREATE POLICY notifications_read_own ON notifications
    FOR SELECT TO authenticated
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
    FOR UPDATE TO authenticated
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS notifications_admin_all ON notifications;
CREATE POLICY notifications_admin_all ON notifications
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- LIBRARY
-- ============================================================================

DROP POLICY IF EXISTS library_books_read_all ON library_books;
CREATE POLICY library_books_read_all ON library_books
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS library_books_admin_write ON library_books;
CREATE POLICY library_books_admin_write ON library_books
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS library_reservations_read_own ON library_reservations;
CREATE POLICY library_reservations_read_own ON library_reservations
    FOR SELECT TO authenticated
    USING (student_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS library_reservations_insert_own ON library_reservations;
CREATE POLICY library_reservations_insert_own ON library_reservations
    FOR INSERT TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS library_reservations_admin_all ON library_reservations;
CREATE POLICY library_reservations_admin_all ON library_reservations
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- ISSUES
-- ============================================================================

DROP POLICY IF EXISTS issues_read_all ON issues;
CREATE POLICY issues_read_all ON issues
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS issues_insert_own ON issues;
CREATE POLICY issues_insert_own ON issues
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS issues_update_admin ON issues;
CREATE POLICY issues_update_admin ON issues
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS issue_reports_read_own ON issue_reports;
CREATE POLICY issue_reports_read_own ON issue_reports
    FOR SELECT TO authenticated
    USING (reporter_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS issue_reports_insert_own ON issue_reports;
CREATE POLICY issue_reports_insert_own ON issue_reports
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = auth.uid());

-- ============================================================================
-- LOST & FOUND
-- ============================================================================

DROP POLICY IF EXISTS lost_items_read_all ON lost_items;
CREATE POLICY lost_items_read_all ON lost_items
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS lost_items_insert_own ON lost_items;
CREATE POLICY lost_items_insert_own ON lost_items
    FOR INSERT TO authenticated
    WITH CHECK (reported_by_user_id = auth.uid());

DROP POLICY IF EXISTS lost_items_update_own ON lost_items;
CREATE POLICY lost_items_update_own ON lost_items
    FOR UPDATE TO authenticated
    USING (reported_by_user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS found_items_read_all ON found_items;
CREATE POLICY found_items_read_all ON found_items
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS found_items_insert_own ON found_items;
CREATE POLICY found_items_insert_own ON found_items
    FOR INSERT TO authenticated
    WITH CHECK (found_by_user_id = auth.uid());

DROP POLICY IF EXISTS found_items_update_own ON found_items;
CREATE POLICY found_items_update_own ON found_items
    FOR UPDATE TO authenticated
    USING (found_by_user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- EMERGENCY REPORTS
-- ============================================================================

DROP POLICY IF EXISTS emergency_reports_read_own ON emergency_reports;
CREATE POLICY emergency_reports_read_own ON emergency_reports
    FOR SELECT TO authenticated
    USING (reporter_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS emergency_reports_insert_own ON emergency_reports;
CREATE POLICY emergency_reports_insert_own ON emergency_reports
    FOR INSERT TO authenticated
    WITH CHECK (reporter_id = auth.uid() OR reporter_id IS NULL);

DROP POLICY IF EXISTS emergency_reports_admin_update ON emergency_reports;
CREATE POLICY emergency_reports_admin_update ON emergency_reports
    FOR UPDATE TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- PRESENCE / LOCATION
-- ============================================================================

DROP POLICY IF EXISTS presence_consent_read_own ON presence_consent;
CREATE POLICY presence_consent_read_own ON presence_consent
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS presence_consent_insert_own ON presence_consent;
CREATE POLICY presence_consent_insert_own ON presence_consent
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS presence_consent_update_own ON presence_consent;
CREATE POLICY presence_consent_update_own ON presence_consent
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- FACULTY AVAILABILITY
-- ============================================================================

DROP POLICY IF EXISTS faculty_availability_read_all ON faculty_availability;
CREATE POLICY faculty_availability_read_all ON faculty_availability
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS faculty_availability_insert_own ON faculty_availability;
CREATE POLICY faculty_availability_insert_own ON faculty_availability
    FOR INSERT TO authenticated
    WITH CHECK (faculty_id = auth.uid());

DROP POLICY IF EXISTS faculty_availability_update_own ON faculty_availability;
CREATE POLICY faculty_availability_update_own ON faculty_availability
    FOR UPDATE TO authenticated
    USING (faculty_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- CROWD / PULSE
-- ============================================================================

DROP POLICY IF EXISTS crowd_reports_read_all ON crowd_reports;
CREATE POLICY crowd_reports_read_all ON crowd_reports
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS crowd_reports_insert_own ON crowd_reports;
CREATE POLICY crowd_reports_insert_own ON crowd_reports
    FOR INSERT TO authenticated
    WITH CHECK (reported_by_user_id = auth.uid());

DROP POLICY IF EXISTS crowd_states_read_all ON crowd_states;
CREATE POLICY crowd_states_read_all ON crowd_states
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- DIGITAL TWIN STATE
-- ============================================================================

DROP POLICY IF EXISTS campus_state_read_authenticated ON campus_state;
CREATE POLICY campus_state_read_authenticated ON campus_state
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS campus_state_admin_write ON campus_state;
CREATE POLICY campus_state_admin_write ON campus_state
    FOR ALL TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

-- ============================================================================
-- AUDIT / SYSTEM
-- ============================================================================

DROP POLICY IF EXISTS audit_logs_read_admin ON audit_logs;
CREATE POLICY audit_logs_read_admin ON audit_logs
    FOR SELECT TO authenticated
    USING (auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS agent_executions_read_own ON agent_executions;
CREATE POLICY agent_executions_read_own ON agent_executions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR auth.role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS tool_executions_read_own ON tool_executions;
CREATE POLICY tool_executions_read_own ON tool_executions
    FOR SELECT TO authenticated
    USING (
        agent_execution_id IN (
            SELECT id FROM agent_executions WHERE user_id = auth.uid()
        )
        OR auth.role() IN ('admin', 'super_admin')
    );
