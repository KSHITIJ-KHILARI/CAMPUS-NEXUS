import pytest
import requests

BASE = "http://127.0.0.1:9501/api/v1"

@pytest.fixture
def student_token():
    r = requests.post(f"{BASE}/auth/login", json={"email": "student@somaiya.edu", "password": "demo123"})
    assert r.status_code == 200
    return r.json()["access_token"]

@pytest.fixture
def faculty_token():
    r = requests.post(f"{BASE}/auth/login", json={"email": "faculty@somaiya.edu", "password": "demo123"})
    assert r.status_code == 200
    return r.json()["access_token"]

@pytest.fixture
def admin_token():
    r = requests.post(f"{BASE}/auth/login", json={"email": "admin@somaiya.edu", "password": "demo123"})
    assert r.status_code == 200
    return r.json()["access_token"]

def test_health():
    r = requests.get("http://127.0.0.1:9501/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_student_login(student_token):
    assert student_token is not None

def test_student_me(student_token):
    r = requests.get(f"{BASE}/students/me", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "student"

def test_student_my_day(student_token):
    r = requests.get(f"{BASE}/students/my-day", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "student_name" in data

def test_faculty_me(faculty_token):
    r = requests.get(f"{BASE}/faculty/me", headers={"Authorization": f"Bearer {faculty_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "faculty"

def test_faculty_students(faculty_token):
    r = requests.get(f"{BASE}/faculty/students", headers={"Authorization": f"Bearer {faculty_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_admin_dashboard(admin_token):
    r = requests.get(f"{BASE}/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "buildings" in data

def test_buildings_list(student_token):
    r = requests.get(f"{BASE}/buildings", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_events_list(student_token):
    r = requests.get(f"{BASE}/events", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_library_books(student_token):
    r = requests.get(f"{BASE}/library/books", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_issues_list(student_token):
    r = requests.get(f"{BASE}/issues", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_lost_found_list(student_token):
    r = requests.get(f"{BASE}/lost-found/items?type=lost", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)

def test_navigation_route(student_token):
    r = requests.get(f"{BASE}/navigation/route?from_location=gate&to_location=library", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "from" in data
    assert "to" in data

def test_ai_chat(student_token):
    r = requests.post(f"{BASE}/ai/chat", json={"message": "hello"}, headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data


def test_ai_chat_hindi_faculty(student_token):
    """Test Hindi/Hinglish faculty availability query."""
    r = requests.post(f"{BASE}/ai/chat", json={"message": "Kaunsa faculty abhi free hai?"}, headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data
    assert "get_faculty_availability" in data["tools_used"]


def test_ai_chat_courses(student_token):
    """Test AI course search query."""
    r = requests.post(f"{BASE}/ai/chat", json={"message": "What courses cover AI?"}, headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data
    assert "search_courses" in data["tools_used"]
    assert "Machine Learning" in data["response"]


def test_ai_chat_rooms(student_token):
    """Test free room search query."""
    r = requests.post(f"{BASE}/ai/chat", json={"message": "Are there any free rooms?"}, headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data
    assert "find_available_rooms" in data["tools_used"]

def test_emergency_report(student_token):
    r = requests.post(f"{BASE}/emergency/report", json={
        "emergency_type": "MEDICAL",
        "severity": "HIGH",
        "location_name": "Test Location",
        "description": "Test emergency"
    }, headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "REPORTED"

def test_presence_consent(student_token):
    r = requests.get(f"{BASE}/presence/consent", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200
    data = r.json()
    assert "is_enabled" in data
    assert isinstance(data["is_enabled"], bool)
    assert "privacy_mode" in data
