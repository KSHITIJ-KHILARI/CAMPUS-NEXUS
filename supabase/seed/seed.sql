-- Campus NEXUS Supabase Seed Data
-- Minimal demo data for local/Supabase development.

-- ============================================================================
-- USERS (password: demo123 for all)
-- ============================================================================

INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_verified, department_id, student_id, faculty_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'student@somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOY5hJ5e8xO5J5e8xO5J5e8xO5J5e8xO', 'Arjun Mehta', 'student', true, true, 1, 1, NULL),
  ('22222222-2222-2222-2222-222222222222', 'faculty@somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOY5hJ5e8xO5J5e8xO5J5e8xO5J5e8xO', 'Dr. Priya Sharma', 'faculty', true, true, 1, NULL, 1),
  ('33333333-3333-3333-3333-333333333333', 'admin@somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOY5hJ5e8xO5J5e8xO5J5e8xO5J5e8xO', 'Admin User', 'admin', true, true, NULL, NULL, NULL),
  ('44444444-4444-4444-4444-444444444444', 'diya.shah@somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOY5hJ5e8xO5J5e8xO5J5e8xO5J5e8xO', 'Diya Shah', 'student', true, true, 2, 2, NULL),
  ('55555555-5555-5555-5555-555555555555', 'rajesh.kumar@somaiya.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOY5hJ5e8xO5J5e8xO5J5e8xO5J5e8xO', 'Dr. Rajesh Kumar', 'faculty', true, true, 1, NULL, 2)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

INSERT INTO departments (id, name, code, description)
VALUES
  (1, 'Computer Science and Engineering', 'CSE', 'Department of Computer Science and Engineering'),
  (2, 'Information Technology', 'IT', 'Department of Information Technology'),
  (3, 'Electronics and Telecommunication', 'EXTC', 'Department of Electronics and Telecommunication'),
  (4, 'Mechanical Engineering', 'ME', 'Department of Mechanical Engineering')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PROGRAMS
-- ============================================================================

INSERT INTO programs (id, name, code, department_id, duration_years, total_credits)
VALUES
  (1, 'B.Tech Computer Science', 'BTECH-CSE', 1, 4, 160),
  (2, 'B.Tech Information Technology', 'BTECH-IT', 2, 4, 160),
  (3, 'Master of Computer Applications', 'MCA', 1, 2, 120),
  (4, 'B.Tech Electronics', 'BTECH-EXTC', 3, 4, 160)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- BUILDINGS
-- ============================================================================

INSERT INTO buildings (id, name, code, address, latitude, longitude, num_floors, description, is_accessible)
VALUES
  (1, 'Computer Science Building (SSBAS)', 'SSBAS', 'Somaiya Vidyavihar Main Campus', 19.0878, 72.8638, 4, 'State-of-the-art CS and IT laboratories', true),
  (2, 'Aurobindo Building', 'AUROBINDO', 'Somaiya Vidyavihar Main Campus', 19.0880, 72.8636, 4, 'Academic block with lecture halls', true),
  (3, 'Bhaskaracharya Academic Block', 'BHASKARACHARYA', 'Somaiya Vidyavihar Main Campus', 19.0881, 72.8635, 5, 'Central academic block', true),
  (4, 'Central Library', 'LIBRARY', 'Somaiya Vidyavihar Main Campus', 19.0885, 72.8632, 3, 'Central library with digital learning resources', true),
  (5, 'Gargi Plaza', 'GARGI', 'Somaiya Vidyavihar Main Campus', 19.0882, 72.8634, 1, 'Student activity center and plaza', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- CAMPUS LOCATIONS
-- ============================================================================

INSERT INTO campus_locations (id, name, location_type, building_id, floor_id, latitude, longitude, capacity, is_accessible, status)
VALUES
  (1, 'Main Gate', 'gate', NULL, NULL, 19.0875, 72.8640, NULL, true, 'active'),
  (2, 'CSB 302', 'classroom', 1, 3, 19.0878, 72.8638, 60, true, 'active'),
  (3, 'Library 2nd Floor', 'library', 4, 2, 19.0885, 72.8632, 120, true, 'active'),
  (4, 'Main Canteen', 'canteen', 5, 1, 19.0882, 72.8634, 150, true, 'active'),
  (5, 'Gargi Plaza', 'plaza', 5, 1, 19.0882, 72.8634, 200, true, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EVENTS
-- ============================================================================

INSERT INTO events (id, title, description, event_type, location_id, start_time, end_time, organizer, max_participants, registrations, status)
VALUES
  ('evt_5526dea7', 'API Test Event', 'Test event created via API', 'other', 5, '2026-09-04 10:00:00', '2026-09-04 12:00:00', 'Student Activity Center', 150, 0, 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LIBRARY BOOKS
-- ============================================================================

INSERT INTO library_books (id, title, author, isbn, subject, department, total_copies, available_copies)
VALUES
  ('book-arch-martin', 'Clean Architecture: A Craftsman''s Guide', 'Robert C. Martin', '978-0134494166', 'Software Engineering', 'Computer Science', 5, 3),
  ('book-ddd', 'Domain-Driven Design', 'Eric Evans', '978-0321125217', 'Software Architecture', 'Computer Science', 3, 2),
  ('book-akka', 'Akka in Action', 'Raymond Roestenburg', '978-1617291012', 'Distributed Systems', 'Computer Science', 2, 1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EMERGENCY REPORTS (seed one for testing)
-- ============================================================================

INSERT INTO emergency_reports (id, reporter_id, reporter_name, emergency_type, severity, location_name, description, status)
VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Arjun Mehta', 'MEDICAL', 'HIGH', 'CSB 302', 'Student feeling unwell during lecture', 'REPORTED')
ON CONFLICT (id) DO NOTHING;
