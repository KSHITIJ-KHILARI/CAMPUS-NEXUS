import type { ReactNode } from "react";

export type UserRole = "student" | "faculty" | "admin" | "super_admin";

export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  role: "student";
  studentId: string;
  universityRollNumber: string;
  enrollmentNumber: string;
  program: string;
  department: string;
  year: number;
  semester: number;
  batch: string;
  guardianContact?: string;
  hostel?: string;
  roomNumber?: string;
  courses: CourseEnrollment[];
  timetable?: Timetable;
}

export interface Faculty extends User {
  role: "faculty";
  facultyId: string;
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  specializations: string[];
  officeLocation?: string;
  consultationHours: TimeSlot[];
  courses: CourseSection[];
}

export interface Admin extends User {
  role: "admin" | "super_admin";
  adminId: string;
  department: string;
  permissions: string[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  prerequisites: string[];
  learningOutcomes: string[];
}

export interface CourseSection {
  id: string;
  courseId: string;
  course: Course;
  section: string;
  semester: number;
  faculty: Faculty;
  students: Student[];
  schedule: ScheduleEntry;
  maxCapacity: number;
  enrolledCount: number;
}

export interface CourseEnrollment {
  id: string;
  studentId: string;
  courseSectionId: string;
  courseSection: CourseSection;
  enrollmentDate: string;
  status: "enrolled" | "dropped" | "completed";
  grade?: string;
}

export interface ScheduleEntry {
  id: string;
  courseSectionId: string;
  courseCode: string;
  courseName: string;
  faculty: string;
  roomId: string;
  buildingId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  type: "lecture" | "lab" | "tutorial";
  recurrence: RecurrencePattern;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type RecurrencePattern = "weekly" | "biweekly" | "monthly";

export interface TimeSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Timetable {
  id: string;
  userId: string;
  entries: ScheduleEntry[];
  lastUpdated: string;
}

export interface ClassSession {
  id: string;
  courseSectionId: string;
  courseSection: CourseSection;
  roomId: string;
  scheduledAt: string;
  actualStart?: string;
  actualEnd?: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  attendance: AttendanceRecord[];
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  classSessionId: string;
  studentId: string;
  status: "present" | "absent" | "late";
  timestamp?: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  description: string;
  coordinates: { lat: number; lng: number };
  floors: Floor[];
  imageUrl?: string;
  yearBuilt: number;
  department: string;
  facilities: Facility[];
  status: "operational" | "maintenance" | "closed";
}

export interface Floor {
  id: string;
  buildingId: string;
  number: number;
  name: string;
  rooms: Room[];
  layoutImageUrl?: string;
  coordinates: { lat: number; lng: number };
}

export interface Room {
  id: string;
  floorId: string;
  buildingId: string;
  number: string;
  name: string;
  type: "classroom" | "laboratory" | "office" | "library" | "cafeteria" | "other";
  capacity: number;
  facilities: string[];
  coordinate?: { x: number; y: number };
  status: "available" | "occupied" | "maintenance";
}

export interface Classroom extends Room {
  type: "classroom";
  schedule: ScheduleEntry[];
}

export interface Laboratory extends Room {
  type: "laboratory";
  domain: string;
  equipment: Equipment[];
  inCharge: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  status: "operational" | "maintenance" | "out_of_order";
  lastChecked: string;
}

export interface Facility {
  id: string;
  name: string;
  type: "cafeteria" | "library" | "gym" | "lab" | "other";
  buildingId: string;
  floorId: string;
  roomId?: string;
  status: "open" | "closed" | "maintenance";
  capacity?: number;
  currentOccupancy?: number;
  coordinates: { lat: number; lng: number };
  operatingHours: OperatingHours;
}

export interface OperatingHours {
  open: string;
  close: string;
  days: DayOfWeek[];
}

export type FacilityType =
  | "cafeteria"
  | "library"
  | "gym"
  | "lab"
  | "other";

export interface Lift {
  id: string;
  buildingId: string;
  number: string;
  name?: string;
  currentFloor: number;
  direction: "up" | "down" | "idle";
  status: "operational" | "maintenance" | "out_of_order";
  passengers: number;
  capacity: number;
}

export type LiftStatusType = "operational" | "maintenance" | "out_of_order";

export interface CrowdReport {
  id: string;
  locationId: string;
  locationType: "building" | "floor" | "room" | "facility";
  level: CrowdLevel;
  count: number;
  capacity: number;
  timestamp: string;
  source: "wifi" | "camera" | "manual" | "estimated";
}

export type CrowdLevel = "low" | "medium" | "high" | "critical";

export interface CrowdState {
  locationId: string;
  locationType: "building" | "floor" | "room" | "facility";
  level: CrowdLevel;
  count: number;
  capacity: number;
  trend: "increasing" | "decreasing" | "stable";
  lastUpdated: string;
}

export interface BuzzPost {
  id: string;
  authorId: string;
  author: {
    name: string;
    avatar?: string;
    role: UserRole;
  };
  content: string;
  type: "question" | "answer" | "announcement" | "tip";
  tags: string[];
  votes: number;
  answers: BuzzPost[];
  liked: boolean;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category:
    | "infrastructure"
    | "it"
    | "safety"
    | "cleanliness"
    | "cafeteria"
    | "library"
    | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  location?: {
    buildingId?: string;
    roomId?: string;
    coordinates?: { lat: number; lng: number };
  };
  reporterId?: string;
  assigneeId?: string;
  comments: IssueComment[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  media: string[];
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface IssueCluster {
  id: string;
  centroid: { lat: number; lng: number };
  count: number;
  issues: Issue[];
  buildingId?: string;
}

export type IssueReport = Omit<Issue, "id" | "createdAt" | "updatedAt">;

export interface LostItem {
  id: string;
  title: string;
  description: string;
  category: "electronics" | "documents" | "clothing" | "accessories" | "other";
  location: string;
  dateLost: string;
  image?: string;
  reporterId?: string;
  reporterName: string;
  status: "lost" | "found" | "claimed";
  claimedById?: string;
}

export interface FoundItem {
  id: string;
  title: string;
  description: string;
  category: "electronics" | "documents" | "clothing" | "accessories" | "other";
  location: string;
  dateFound: string;
  image?: string;
  finderId?: string;
  finderName: string;
  status: "reported" | "verified" | "returned";
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type:
    | "academic"
    | "cultural"
    | "sports"
    | "workshop"
    | "seminar"
    | "other";
  location: string;
  buildingId?: string;
  coordinates: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  organizer: string;
  attendees: string[];
  tags: string[];
  capacity?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "class_reminder"
    | "assignment"
    | "announcement"
    | "issue_update"
    | "event"
    | "general";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Route {
  id: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    name?: string;
    type: "start" | "mid" | "end" | "transfer";
  }>;
  distance: number;
  duration: number;
  polyline: string;
}

export interface NavigationResult {
  route: Route;
  currentStep: number;
  nextStep: {
    instruction: string;
    distance: number;
    duration: number;
  };
  remainingDistance: number;
  remainingDuration: number;
}

export interface Simulation {
  id: string;
  name: string;
  description: string;
  state: SimulationState;
  parameters: Record<string, unknown>;
  results?: SimulationResults;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type SimulationState = "idle" | "running" | "paused" | "completed" | "error";

export interface SimulationResults {
  metrics: Array<{ name: string; value: number; unit?: string }>;
  charts: Array<{
    type: string;
    data: unknown;
    options: Record<string, unknown>;
  }>;
  insights: string[];
}

export interface OptimizationResult {
  id: string;
  type:
    | "timetable"
    | "routing"
    | "resource_allocation"
    | "crowd_management";
  objective: string;
  score: number;
  improvements: Array<{
    metric: string;
    before: number;
    after: number;
    change: number;
  }>;
  recommendations: string[];
  applied: boolean;
  createdAt: string;
}

export interface AIResponse {
  id: string;
  message: string;
  intent: string;
  confidence: number;
  suggestedActions: Array<{
    label: string;
    action: () => void;
    icon?: ReactNode;
  }>;
  data?: unknown;
  timestamp: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  result?: unknown;
}

export interface CampusState {
  buildings: Building[];
  lifts: Lift[];
  crowd: Map<string, CrowdState>;
  events: Event[];
  issues: Issue[];
  notifications: Notification[];
  lastUpdated: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
