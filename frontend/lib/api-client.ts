import { db, auth } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  limit as fLimit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import type { PaginatedResponse } from "./types";
import { signOut } from "firebase/auth";
import {
  getStoredStudents,
  getStudentById,
  updateStudentPortfolio,
  getStoredFaculty,
  getFacultyById,
  updateFacultyStatus,
  getStoredTimetable,
  cancelLectureSlot,
  restoreLectureSlot,
  addPersonalSlot,
  deleteSlot,
  getStoredRooms,
  getVacantRoomsStatus,
  getStoredMaterials,
  addClassroomMaterial,
  deleteClassroomMaterial,
  getStoredEvents,
  toggleEventRegistration,
  createEvent,
  updateEvent,
  deleteEvent,
  getStoredNotifications,
  addCentralNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  getStoredCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  addStudent,
  updateStudent,
  archiveStudent,
  addFaculty,
  updateFaculty,
  archiveFaculty,
  getFacultyLiveAvailability,
  getStoredLibraryBooks,
  reserveLibraryBook,
  getStoredStudyGuides,
  reserveStudyGuide,
  type LibraryBook,
  type StudyGuide,
  type StudentProfile,
  type FacultyMember,
  type CourseData,
  type TimetableSlot,
  type CampusRoom,
  type RoomVacancyInfo,
  type ClassroomMaterial,
  type UniversityEvent,
  type CentralNotification,
} from "./relationalCampusData";

class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

// Utility to handle paginated responses
function createPaginated<T>(data: T[], page: number, limit: number): PaginatedResponse<T> {
  return {
    data,
    page,
    limit,
    total: data.length, // approximation for now
    hasMore: data.length === limit,
  };
}

export const api = {
  auth: {
    logout: async () => {
      await signOut(auth);
      localStorage.removeItem("auth_token");
      document.cookie = "nexus_token=; Max-Age=0; path=/;";
      if (typeof window !== "undefined") window.location.href = "/auth/login";
    },
    verify: async () => {
      const user = auth.currentUser;
      if (!user) throw new ApiError(401, "Not authenticated");
      return user;
    },
  },

  user: {
    getProfile: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new ApiError(401, "Unauthorized");
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) throw new ApiError(404, "User not found");
      return userDoc.data();
    },
    updateProfile: async (data: any) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new ApiError(401, "Unauthorized");
      await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
      return { success: true };
    },
    getRole: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new ApiError(401, "Unauthorized");
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) throw new ApiError(404, "User not found");
      return { role: userDoc.data().role };
    },
  },

  students: {
    getMe: async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const d = await getDoc(doc(db, "students", uid));
          if (d.exists()) return { id: d.id, ...d.data() };
        } catch (e) {}
      }
      return getStudentById(uid || "stu-101") || null;
    },
    getAll: async () => {
      return getStoredStudents();
    },
    getById: async (id: string) => {
      return getStudentById(id);
    },
    getMyDay: async () => {
      const slots = getStoredTimetable().filter(s => s.day_of_week === "Monday" && !s.is_cancelled);
      return { today: slots, classes: slots };
    },
    getSchedule: async () => {
      const allSlots = getStoredTimetable();
      return { entries: allSlots };
    },
    getPortfolio: async (requestedId?: string) => {
      const uid = auth.currentUser?.uid;
      const targetId = requestedId || uid || "stu-101";
      if (uid) {
        try {
          const d = await getDoc(doc(db, "students", uid));
          if (d.exists()) {
            const data = d.data();
            return {
              ...data,
              projects: data.projects || [],
              internships: data.internships || [],
              clubs: data.clubs || [],
              certifications: data.certifications || [],
              skills: data.skills || []
            };
          }
        } catch (e) {}
      }
      const student = getStudentById(targetId);
      if (student) return student;
      return getStoredStudents()[0];
    },
    updatePortfolio: async (data: any) => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await updateDoc(doc(db, "students", uid), data);
        } catch (e) {}
      }
      return updateStudentPortfolio(uid || "stu-101", data);
    },
  },

  faculty: {
    getMe: async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const d = await getDoc(doc(db, "faculty", uid));
          if (d.exists()) return { id: d.id, ...d.data() };
        } catch (e) {}
      }
      return getFacultyById(uid || "fac-smith") || null;
    },
    getAll: async () => {
      return getStoredFaculty();
    },
    getById: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "faculty", id));
        if (d.exists()) return { id: d.id, ...d.data() };
      } catch (e) {}
      return getFacultyById(id);
    },
    getSchedule: async (facultyId?: string) => {
      const targetId = facultyId || "fac-smith";
      const slots = getStoredTimetable().filter(s => s.faculty_id === targetId);
      const normalized = slots.map(s => ({
        ...s,
        course: `${s.course_code} — ${s.course_name}`,
        course_name: s.course_name,
        course_code: s.course_code,
        name: `${s.course_code} — ${s.course_name}`,
        room: s.room_number,
        room_number: s.room_number,
        start: s.start_time,
        start_time: s.start_time,
        end: s.end_time,
        end_time: s.end_time,
        time: `${s.start_time} - ${s.end_time}`,
        day: s.day_of_week,
        day_of_week: s.day_of_week,
        section: "A",
      }));
      return { entries: normalized };
    },
    getAvailability: async () => ({ is_available: true }),
    getAvailabilityStatus: async (facultyId: string) => {
      return getFacultyLiveAvailability(facultyId);
    },
    updateStatus: async (id: string, status: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE") => {
      return updateFacultyStatus(id, status);
    },
    getRelevant: async () => {
      return getStoredFaculty();
    },
    getAllAvailability: async () => {
      return getStoredFaculty();
    },
    setAvailability: async (data: any) => ({ success: true } as any),
    getStudents: async () => {
      return getStoredStudents();
    },
    getCourses: async () => {
      return getStoredCourses();
    },
  },

  pulse: {
    getCampusPulse: async () => {
      const pulseQuery = query(collection(db, "pulse_locations"));
      const snapshot = await getDocs(pulseQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getLocations: async () => {
      const pulseQuery = query(collection(db, "pulse_locations"));
      const snapshot = await getDocs(pulseQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    reportCrowd: async (data: any) => {
      await addDoc(collection(db, "crowd_reports"), { ...data, timestamp: serverTimestamp() });
      return { success: true };
    },
    getBuzz: async () => [],
    postBuzz: async () => ({ success: true }),
  },

  admin: {
    getDashboard: async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const issuesSnap = await getDocs(collection(db, "issues"));
      return { metrics: { total_users: usersSnap.docs.length, active_issues: issuesSnap.docs.length } };
    },
    getAnalytics: async () => ({}),
    getSystemHealth: async () => ({ status: "healthy", services: [] } as any),
    getUsers: async (search?: string) => {
      const snapshot = await getDocs(collection(db, "users"));
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (search) {
        const s = search.toLowerCase();
        results = results.filter((u: any) => (u.full_name && u.full_name.toLowerCase().includes(s)) || (u.email && u.email.toLowerCase().includes(s)));
      }
      return results;
    },
    createUser: async (data: any) => {
      // Create user document
      const docRef = await addDoc(collection(db, "users"), { ...data, created_at: serverTimestamp() });
      return { id: docRef.id, ...data };
    },
    updateUser: async (id: string, data: any) => updateDoc(doc(db, "users", id), data),
    getStudents: async (queryStr?: string) => {
      let results: any[] = [];
      try {
        const snapshot = await getDocs(collection(db, "students"));
        results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {}

      if (results.length === 0) {
        results = getStoredStudents().map(s => ({
          id: s.student_id,
          user_id: s.student_id,
          full_name: s.full_name,
          name: s.name,
          email: s.email,
          roll_number: s.student_id_number,
          program: s.program,
          department: s.department,
          semester: s.semester,
          cgpa: s.cgpa,
          is_active: true,
        }));
      }

      if (queryStr) {
        const s = queryStr.toLowerCase();
        results = results.filter((u: any) =>
          (u.name && u.name.toLowerCase().includes(s)) ||
          (u.full_name && u.full_name.toLowerCase().includes(s)) ||
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.roll_number && u.roll_number.toLowerCase().includes(s)) ||
          (u.program && u.program.toLowerCase().includes(s))
        );
      }
      return results;
    },
    createStudent: async (data: any) => {
      const newStudent = addStudent(data);
      try {
        await addDoc(collection(db, "students"), { ...data, id: newStudent.student_id, created_at: serverTimestamp() });
      } catch (e) {}
      return { id: newStudent.student_id, ...newStudent };
    },
    getStudent: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "students", id));
        if (d.exists()) return { id: d.id, ...d.data() };
      } catch (e) {}
      return getStudentById(id);
    },
    updateStudent: async (id: string, data: any) => {
      updateStudent(id, data);
      try { await updateDoc(doc(db, "students", id), data); } catch (e) {}
      return { success: true };
    },
    archiveStudent: async (id: string) => {
      archiveStudent(id);
      try { await deleteDoc(doc(db, "students", id)); } catch (e) {}
      return { success: true };
    },
    deleteStudent: async (id: string) => {
      archiveStudent(id);
      try { await deleteDoc(doc(db, "students", id)); } catch (e) {}
      return { success: true };
    },
    
    getFaculty: async (queryStr?: string) => {
      let results: any[] = [];
      try {
        const snapshot = await getDocs(collection(db, "faculty"));
        results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {}

      if (results.length === 0) {
        results = getStoredFaculty().map(f => ({
          id: f.id,
          user_id: f.id,
          full_name: f.full_name,
          name: f.name,
          email: f.email,
          employee_id: f.faculty_id,
          designation: f.designation,
          department: f.department,
          office_location: f.office_location,
          is_available: f.is_available,
          is_active: true,
        }));
      }

      if (queryStr) {
        const s = queryStr.toLowerCase();
        results = results.filter((u: any) =>
          (u.name && u.name.toLowerCase().includes(s)) ||
          (u.full_name && u.full_name.toLowerCase().includes(s)) ||
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.designation && u.designation.toLowerCase().includes(s)) ||
          (u.department && u.department.toLowerCase().includes(s))
        );
      }
      return results;
    },
    createFaculty: async (data: any) => {
      const newFac = addFaculty(data);
      try {
        await addDoc(collection(db, "faculty"), { ...data, id: newFac.id, created_at: serverTimestamp() });
      } catch (e) {}
      return newFac;
    },
    getFacultyMember: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "faculty", id));
        if (d.exists()) return { id: d.id, ...d.data() };
      } catch (e) {}
      return getFacultyById(id);
    },
    updateFaculty: async (id: string, data: any) => {
      updateFaculty(id, data);
      try { await updateDoc(doc(db, "faculty", id), data); } catch (e) {}
      return { success: true };
    },
    archiveFaculty: async (id: string) => {
      archiveFaculty(id);
      try { await deleteDoc(doc(db, "faculty", id)); } catch (e) {}
      return { success: true };
    },
    deleteFaculty: async (id: string) => {
      archiveFaculty(id);
      try { await deleteDoc(doc(db, "faculty", id)); } catch (e) {}
      return { success: true };
    },
    
    getCourses: async (queryStr?: string) => {
      let results: any[] = [];
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {}

      if (results.length === 0) {
        results = getStoredCourses();
      }

      if (queryStr) {
        const s = queryStr.toLowerCase();
        results = results.filter((c: any) =>
          (c.name && c.name.toLowerCase().includes(s)) ||
          (c.code && c.code.toLowerCase().includes(s)) ||
          (c.department && c.department.toLowerCase().includes(s))
        );
      }
      return results;
    },
    createCourse: async (data: any) => {
      const newCourse = addCourse(data);
      try { await addDoc(collection(db, "courses"), newCourse); } catch (e) {}
      return newCourse;
    },
    updateCourse: async (id: any, data: any) => {
      updateCourse(id, data);
      try { await updateDoc(doc(db, "courses", id), data); } catch (e) {}
      return { success: true };
    },
    deleteCourse: async (id: any) => {
      deleteCourse(id);
      try { await deleteDoc(doc(db, "courses", id)); } catch (e) {}
      return { success: true };
    },
    
    getEnrollments: async (id?: any) => {
      const snapshot = await getDocs(collection(db, "enrollments"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    createEnrollment: async (data: any) => {
      const docRef = await addDoc(collection(db, "enrollments"), data);
      return { id: docRef.id, ...data };
    },
    deleteEnrollment: async (id: any) => deleteDoc(doc(db, "enrollments", id)),
    
    getIssues: async () => {
      const snapshot = await getDocs(collection(db, "issues"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getIssue: async (id: any) => {
      const d = await getDoc(doc(db, "issues", id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    
    getEvents: async (queryStr?: string) => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        if (!snapshot.empty) return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {}
      return getStoredEvents();
    },
    getEvent: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "events", id));
        if (d.exists()) return { id: d.id, ...d.data() };
      } catch (e) {}
      return getStoredEvents().find(e => e.id === id) || null;
    },
    createEvent: async (data: any) => {
      try {
        await addDoc(collection(db, "events"), data);
      } catch (e) {}
      return createEvent(data);
    },
    deleteEvent: async (id: string) => {
      try {
        await deleteDoc(doc(db, "events", id));
      } catch (e) {}
      return deleteEvent(id);
    },
  },

  buildings: {
    getAll: async (page = 1, limit = 20) => {
      const snapshot = await getDocs(query(collection(db, "buildings"), fLimit(limit)));
      return createPaginated(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), page, limit);
    },
    getById: async (id: string) => {
      const d = await getDoc(doc(db, "buildings", id));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    getByDepartment: async (dept: string) => {
      const snapshot = await getDocs(query(collection(db, "buildings"), where("department", "==", dept)));
      return createPaginated(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), 1, 20);
    },
  },

  rooms: {
    getVacant: async (day?: string, time?: string) => {
      return getVacantRoomsStatus(day || "Monday", time || "10:30");
    },
    getAll: async () => getStoredRooms(),
    getAllRooms: async () => getStoredRooms(),
    getById: async (id: string) => {
      return getStoredRooms().find(r => r.id === id || r.room_number === id) || null;
    },
    getByBuilding: async (buildingId: string) => {
      const list = getStoredRooms().filter(r => r.building_id === buildingId);
      return createPaginated(list, 1, 20);
    },
    getAvailability: async () => ({ isAvailable: true }),
    createReservation: async (data: any) => {
      const uid = auth.currentUser?.uid || "stu-101";
      const docRef = await addDoc(collection(db, "room_reservations"), {
        ...data,
        student_id: uid,
        status: "pending",
        reserved_at: new Date().toISOString(),
      });
      return { id: docRef.id, ...data, student_id: uid, status: "pending" };
    },
    getReservations: async () => {
      try {
        const snapshot = await getDocs(collection(db, "room_reservations"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) { return []; }
    },
    updateReservation: async (id: string, data: any) => {
      try {
        await updateDoc(doc(db, "room_reservations", id), data);
      } catch (e) {}
      return { id, ...data };
    },
    getActiveReservations: async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "room_reservations"), where("status", "in", ["approved", "pending"])));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) { return []; }
    }
  },

  timetable: {
    getMaster: async () => getStoredTimetable(),
    getSlots: async () => getStoredTimetable(),
    getStudentSchedule: async (studentId?: string) => {
      const student = getStudentById(studentId || "stu-101");
      const courseIds = student?.enrolled_courses || [];
      const slots = getStoredTimetable();
      return slots.filter(s => courseIds.includes(s.course_id) || s.type === "personal");
    },
    getFacultySchedule: async (facultyId?: string) => {
      const fid = facultyId || "fac-smith";
      return getStoredTimetable().filter(s => s.faculty_id === fid);
    },
    cancelLecture: async (slotId: string, reason: string) => {
      return cancelLectureSlot(slotId, reason);
    },
    restoreLecture: async (slotId: string) => {
      return restoreLectureSlot(slotId);
    },
    addPersonalSlot: async (data: any) => {
      return addPersonalSlot(data);
    },
    deleteSlot: async (slotId: string) => {
      return deleteSlot(slotId);
    },
  },

  classroom: {
    getMaterials: async (courseId?: string) => getStoredMaterials(courseId),
    uploadMaterial: async (mat: any) => addClassroomMaterial(mat),
    deleteMaterial: async (id: string) => deleteClassroomMaterial(id),
  },

  location: {
    getLocations: async (): Promise<any[]> => {
      try {
        const snapshot = await getDocs(collection(db, "campus_locations"));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
      try {
        const snapshot = await getDocs(collection(db, "buildings"));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
      return [
        { id: "ssbas", name: "KJSCE (SSBAS) Engineering", code: "SSBAS", location_type: "academic", capacity: 2200, floor: 4, travel_time_minutes: 6, latitude: 19.0732, longitude: 72.8998 },
        { id: "library", name: "Somaiya Central Library", code: "LIB", location_type: "library", capacity: 1200, floor: 3, travel_time_minutes: 4, latitude: 19.0728, longitude: 72.9005 },
        { id: "aurobindo", name: "Aurobindo Building", code: "AURO", location_type: "academic", capacity: 1600, floor: 4, travel_time_minutes: 5, latitude: 19.0735, longitude: 72.8992 },
        { id: "bhaskaracharya", name: "Bhaskaracharya Complex", code: "BHAK", location_type: "academic", capacity: 2800, floor: 5, travel_time_minutes: 7, latitude: 19.0725, longitude: 72.9010 },
        { id: "canteen", name: "Somaiya Central Canteen", code: "CANT", location_type: "cafeteria", capacity: 950, floor: 2, travel_time_minutes: 3, latitude: 19.0730, longitude: 72.9002 },
        { id: "gargi", name: "Gargi Plaza & Amphitheatre", code: "GARG", location_type: "plaza", capacity: 3500, floor: 1, travel_time_minutes: 2, latitude: 19.0731, longitude: 72.9000 },
        { id: "sports", name: "Somaiya Sports Academy", code: "SPRT", location_type: "sports", capacity: 4500, floor: 2, travel_time_minutes: 8, latitude: 19.0740, longitude: 72.8985 },
        { id: "gate", name: "Somaiya Vidyavihar Main Gate", code: "GATE", location_type: "transit", capacity: 10000, floor: 1, travel_time_minutes: 0, latitude: 19.0720, longitude: 72.9015 },
      ];
    },
    getRush: async (): Promise<any[]> => {
      try {
        const snapshot = await getDocs(collection(db, "crowd_states"));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
      try {
        const snapshot = await getDocs(collection(db, "pulse_locations"));
        if (!snapshot.empty) {
          return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {}
      return [
        { id: "canteen", crowd: "high", count: 680, rush_level: "HIGH" },
        { id: "library", crowd: "moderate", count: 420, rush_level: "MODERATE" },
        { id: "ssbas", crowd: "moderate", count: 850, rush_level: "MODERATE" },
        { id: "gate", crowd: "high", count: 1200, rush_level: "HIGH" },
      ];
    },
    getLocationRush: async (locationId: number|string) => {
      const d = await getDoc(doc(db, "pulse_locations", locationId.toString()));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    subscribeRush: (callback: (data: any[]) => void) => {
      const pulseQuery = query(collection(db, "pulse_locations"));
      return onSnapshot(pulseQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    },
    getAdminOverrides: async (): Promise<any[]> => [],
    createAdminOverride: async (data: any) => ({ success: true }),
    deleteAdminOverride: async (id: string) => ({ success: true }),
    submitLocation: async (data: any) => ({ success: true }),
    disableTracking: async () => ({ success: true }),
    getBuildings: async (): Promise<any[]> => {
      try {
        const { API_BASE_URL } = await import("./constants");
        const res = await fetch(`${API_BASE_URL}/digital-twin/buildings`);
        if (res.ok) return await res.json();
      } catch (e) {}
      try {
        const snapshot = await getDocs(collection(db, "buildings"));
        if (!snapshot.empty) return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {}
      return [];
    }
  },

  events: {
    getAll: async (page = 1, limit = 20) => {
      const list = getStoredEvents();
      return createPaginated(list, page, limit);
    },
    getById: async (id: string) => {
      return getStoredEvents().find(e => e.id === id) || null;
    },
    create: async (data: any) => {
      return createEvent(data);
    },
    update: async (id: string, data: any) => {
      return updateEvent(id, data);
    },
    delete: async (id: string) => {
      return deleteEvent(id);
    },
    register: async (id: string) => {
      return toggleEventRegistration(id);
    },
    cancelRegistration: async (id: string) => {
      return toggleEventRegistration(id);
    },
    getRegistrations: async (id: string) => {
      const ev = getStoredEvents().find(e => e.id === id);
      return { registered: !!ev?.is_registered, registrations: ev?.registrations || 0, capacity: ev?.capacity || 100 };
    },
  },

  notifications: {
    getAll: async (unreadOnly?: boolean) => {
      const list = getStoredNotifications();
      return unreadOnly ? list.filter(n => !n.read) : list;
    },
    markAsRead: async (id: string) => {
      markNotificationAsRead(id);
      return { success: true };
    },
    markAllRead: async () => {
      markAllNotificationsAsRead();
      return { success: true };
    },
    delete: async (id: string) => {
      clearNotification(id);
      return { success: true };
    },
    create: async (data: any) => {
      return addCentralNotification(data);
    },
    subscribeAll: (callback: (data: any[]) => void, unreadOnly?: boolean) => {
      const handleUpdate = () => {
        const notifs = getStoredNotifications();
        callback(unreadOnly ? notifs.filter(n => !n.read) : notifs);
      };
      if (typeof window !== "undefined") {
        window.addEventListener("nexus-notifications-updated", handleUpdate);
        handleUpdate();
        return () => window.removeEventListener("nexus-notifications-updated", handleUpdate);
      }
      return () => {};
    },
  },

  // Mock endpoints
  lifts: { getAll: async (a?: any) => [], getById: async (a?: any) => ({}), getByBuilding: async (a?: any) => [] },
  courses: {
    getAll: async () => {
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        return createPaginated(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })), 1, 20);
      } catch (e) { return createPaginated([], 1, 20); }
    },
    getById: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "courses", id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
      } catch (e) { return null; }
    },
    getByDepartment: async (dept: string) => createPaginated([], 1, 20)
  },
  schedule: {
    getTimetable: async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return { entries: [] };
        const snapshot = await getDocs(query(collection(db, "timetables"), where("userId", "==", uid)));
        return { entries: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
      } catch (e) {
        return { entries: [] };
      }
    },
    getNextClass: async () => null,
    reassignRoom: async (data: any) => ({}),
    getClassSession: async () => ({}),
    getTodaysSessions: async () => []
  },
  library: {
    getBooks: async (queryStr?: string) => {
      try {
        const snapshot = await getDocs(collection(db, "library"));
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (results.length === 0) {
          results = getStoredLibraryBooks() as any;
        }
        if (queryStr) {
          const s = queryStr.toLowerCase();
          results = results.filter((item: any) => 
            (item.title && item.title.toLowerCase().includes(s)) ||
            (item.author && item.author.toLowerCase().includes(s)) ||
            (item.category && item.category.toLowerCase().includes(s)) ||
            (item.subject && item.subject.toLowerCase().includes(s))
          );
        }
        return results;
      } catch (e) {
        let results = getStoredLibraryBooks();
        if (queryStr) {
          const s = queryStr.toLowerCase();
          results = results.filter(item =>
            item.title.toLowerCase().includes(s) ||
            item.author.toLowerCase().includes(s) ||
            (item.category && item.category.toLowerCase().includes(s)) ||
            (item.subject && item.subject.toLowerCase().includes(s))
          );
        }
        return results;
      }
    },
    getBookById: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "library", id));
        if (d.exists()) return { id: d.id, ...d.data() };
      } catch (e) {}
      const books = getStoredLibraryBooks();
      return books.find(b => b.id === id) || null;
    },
    reserveBook: async (id: string) => {
      return reserveLibraryBook(id);
    },
    getStudyGuides: async (queryStr?: string) => {
      let guides = getStoredStudyGuides();
      if (queryStr) {
        const s = queryStr.toLowerCase();
        guides = guides.filter(g =>
          g.title.toLowerCase().includes(s) ||
          g.course_code.toLowerCase().includes(s) ||
          g.course_name.toLowerCase().includes(s)
        );
      }
      return guides;
    },
    reserveStudyGuide: async (id: string) => {
      return reserveStudyGuide(id);
    },
    getSeats: async () => [],
    getOccupancy: async () => ({}),
    getReservations: async () => {
      try {
        const snapshot = await getDocs(collection(db, "library_reservations"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) { return []; }
    },
    updateReservation: async (id: string, data: any) => {
      try {
        await updateDoc(doc(db, "library_reservations", id), data);
      } catch (e) {}
      return { id, ...data };
    },
    createReservation: async (data: any) => {
      const uid = auth.currentUser?.uid || "stu-101";
      const docRef = await addDoc(collection(db, "library_reservations"), {
        ...data,
        student_id: uid,
        status: "pending",
        reserved_at: new Date().toISOString(),
      });
      return { id: docRef.id, ...data, student_id: uid, status: "pending" };
    },
    getActiveReservations: async () => {
      try {
        const snapshot = await getDocs(query(collection(db, "library_reservations"), where("status", "in", ["ready_for_pickup", "pending", "borrowed"])));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) { return []; }
    }
  },
  lostFound: {
    getItems: async (type?: string, search?: string) => {
      try {
        let q = query(collection(db, "lost_found"));
        if (type) {
          q = query(q, where("type", "==", type));
        }
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (search) {
          const s = search.toLowerCase();
          results = results.filter((item: any) => 
            (item.title && item.title.toLowerCase().includes(s)) ||
            (item.description && item.description.toLowerCase().includes(s)) ||
            (item.location && item.location.toLowerCase().includes(s))
          );
        }
        return results;
      } catch (e) { return []; }
    },
    getItemById: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "lost_found", id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
      } catch (e) { return null; }
    },
    reportItem: async (data: any) => {
      await addDoc(collection(db, "lost_found"), { ...data, timestamp: serverTimestamp() });
      return { success: true };
    },
    adminGetAll: async (type?: string) => [],
    adminUpdateStatus: async (id: string, data: any) => ({})
  },
  resources: {
    search: async (queryStr?: string, category?: string) => {
      try {
        const snapshot = await getDocs(collection(db, "resources"));
        let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        if (category) {
          results = results.filter((r: any) => r.category?.toLowerCase() === category.toLowerCase());
        }
        if (queryStr) {
          const s = queryStr.toLowerCase();
          results = results.filter((r: any) =>
            (r.title && r.title.toLowerCase().includes(s)) ||
            (r.category && r.category.toLowerCase().includes(s)) ||
            (r.description && r.description.toLowerCase().includes(s))
          );
        }
        return results;
      } catch (e) { return []; }
    },
    getById: async (id: string) => {
      try {
        const d = await getDoc(doc(db, "resources", id));
        return d.exists() ? { id: d.id, ...d.data() } : null;
      } catch (e) { return null; }
    },
    bookmark: async (a?: any) => ({})
  },
  personalSchedule: {
    getAll: async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return [];
      const snapshot = await getDocs(query(collection(db, "timetables"), where("userId", "==", uid), where("type", "==", "personal")));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    add: async (data: any) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new ApiError(401, "Unauthorized");
      const docRef = await addDoc(collection(db, "timetables"), { ...data, userId: uid, type: "personal", createdAt: serverTimestamp() });
      return { id: docRef.id, ...data };
    },
    update: async (id: string, data: any) => {
      await updateDoc(doc(db, "timetables", id), data);
      return { success: true };
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, "timetables", id));
      return { success: true };
    },
  },
  facultyStatus: {
    getAll: async () => {
      try {
        const [statusSnap, facultySnap] = await Promise.all([
          getDocs(collection(db, "faculty_status")),
          getDocs(collection(db, "faculty")),
        ]);
        const facultyMap: Record<string, any> = {};
        facultySnap.docs.forEach(d => { facultyMap[d.id] = { id: d.id, ...d.data() }; });
        return statusSnap.docs.map(d => ({
          uid: d.id,
          ...d.data(),
          faculty: facultyMap[d.id] || null,
        }));
      } catch (e) { return []; }
    },
    getByUid: async (uid: string) => {
      try {
        const [statusDoc, facultyDoc] = await Promise.all([
          getDoc(doc(db, "faculty_status", uid)),
          getDoc(doc(db, "faculty", uid)),
        ]);
        return {
          uid,
          ...(statusDoc.exists() ? statusDoc.data() : { status: "UNKNOWN" }),
          faculty: facultyDoc.exists() ? { id: facultyDoc.id, ...facultyDoc.data() } : null,
        };
      } catch (e) { return { uid, status: "UNKNOWN", faculty: null }; }
    },
  },
  faq: { search: async (a?: any) => [] },
  crowd: { getState: async (a?: any) => ({}), getReports: async (a?: any) => createPaginated([], 1, 20), getHeatmap: async (a?: any) => [] },
  issues: { getAll: async (a?: any) => createPaginated([], 1, 20), getById: async (a?: any) => ({}), create: async (a?: any) => ({}), update: async (a?: any, b?: any) => ({}), assign: async (a?: any, b?: any) => ({}) },
  ai: {
    sendMessage: async (data: { message: string; role?: string; userUid?: string; userName?: string; department?: string; context?: any }) => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.response || `AI request failed with status ${res.status}`);
        }
        return await res.json();
      } catch (err: any) {
        console.error("api.ai.sendMessage failed:", err);
        throw err;
      }
    },
    getSuggestions: async () => [
      "Where is my next class?",
      "Find an available study pod in the library",
      "Check Database System Concepts textbook copies",
      "Is Dr. Priya Sharma available in her office?",
      "Are there any active maintenance issues in SSBAS?",
    ],
    getTools: async () => {
      try {
        const res = await fetch("/api/ai/tools");
        if (res.ok) {
          const data = await res.json();
          return data.tools || [];
        }
      } catch (e) {}
      return [
        { name: "getStudentSchedule", description: "Get student lecture schedule and room" },
        { name: "getFacultySchedule", description: "Get faculty teaching schedule" },
        { name: "getVacantRooms", description: "Check vacant classrooms and library pods" },
        { name: "getLibraryCatalog", description: "Search textbooks and physical shelf copies" },
        { name: "checkFacultyAvailability", description: "Check professor office hours" },
        { name: "getActiveIssues", description: "Check active maintenance reports" },
      ];
    },
  },
  analytics: { getCampusOverview: async (a?: any) => ({}), getBuildingUsage: async (a?: any) => ({}), getPredictions: async (a?: any) => ({}) },
  simulation: { getSimulations: async (a?: any) => [], getById: async (a?: any) => ({}), run: async (a?: any, b?: any) => ({}), apply: async (a?: any, b?: any) => ({}), getStatus: async (a?: any) => ({}) },
  search: { search: async (a?: any) => createPaginated([], 1, 20) },
  emergency: { report: async (a?: any) => ({}), getActive: async (a?: any) => [], getAll: async (a?: any) => [], getById: async (a?: any) => ({}), updateStatus: async (a?: any, b?: any) => ({}) },
  presence: { getConsent: async (a?: any) => ({} as any), updateConsent: async (a?: any) => ({} as any), updateLocation: async (a?: any) => ({} as any), getCampusSummary: async (a?: any) => ({} as any), getLocation: async (a?: any) => ({} as any) },
  navigation: { getRoute: async (a?: any, b?: any) => ({}), getLeaveNow: async (a?: any) => ({}), getEta: async (a?: any, b?: any) => ({}) },
  digitalTwin: {
    getCampusState: async () => {
      try {
        const { API_BASE_URL } = await import("./constants");
        const res = await fetch(`${API_BASE_URL}/digital-twin/state`);
        if (res.ok) return await res.json();
      } catch (e) {}
      return null;
    }
  }
};

export const apiClient = {
  get: async <T>(path: string, options?: any): Promise<T> => {
    console.warn(`apiClient.get(${path}) is deprecated, use the specific api method instead`);
    return null as T;
  },
  post: async <T>(path: string, body?: any, options?: any): Promise<T> => {
    console.warn(`apiClient.post(${path}) is deprecated, use the specific api method instead`);
    return null as T;
  },
  put: async <T>(path: string, body?: any, options?: any): Promise<T> => {
    console.warn(`apiClient.put(${path}) is deprecated, use the specific api method instead`);
    return null as T;
  },
  delete: async <T>(path: string, options?: any): Promise<T> => {
    console.warn(`apiClient.delete(${path}) is deprecated, use the specific api method instead`);
    return null as T;
  },
  patch: async <T>(path: string, body?: any, options?: any): Promise<T> => {
    console.warn(`apiClient.patch(${path}) is deprecated, use the specific api method instead`);
    return null as T;
  }
};

export { ApiError };
export default api;
