import {
  Building,
  Lift,
  Facility,
  Event,
  Course,
  Faculty,
  Room,
} from "./types";

export const UNIVERSITY_NAME = "Somaiya Vidyavihar University";
export const UNIVERSITY_SHORT_NAME = "SVU";
export const APP_NAME = "CAMPUS NEXUS";
export const APP_TAGLINE = "AI-Powered Campus Intelligence Platform";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "wss://ws.campus-nexus.somaiya.edu";

export const MAP_CENTER = { lat: 19.0882, lng: 72.8634 };
export const MAP_DEFAULT_ZOOM = 16;
export const MAP_STYLE =
  "https://api.maptiler.com/tiles/streets-v2-light/style.css?key=" +
  (process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "YOUR_API_KEY");

export const STATUS_COLORS = {
  operational: "bg-green-500",
  maintenance: "bg-yellow-500",
  closed: "bg-red-500",
  out_of_order: "bg-red-600",
  available: "bg-green-500",
  occupied: "bg-red-500",
  open: "bg-green-500",
  closed_status: "bg-gray-500",
} as const;

export const CROWD_COLORS = {
  low: { bg: "bg-green-500", text: "text-green-500", border: "border-green-500" },
  medium: { bg: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500" },
  high: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500" },
  critical: { bg: "bg-red-500", text: "text-red-500", border: "border-red-500" },
} as const;

export const CROWD_THRESHOLDS = {
  low: { min: 0, max: 0.3 },
  medium: { min: 0.3, max: 0.6 },
  high: { min: 0.6, max: 0.85 },
  critical: { min: 0.85, max: 1 },
} as const;

export const BUILDING_COLORS = [
  "#A51C30",
  "#8F1728",
  "#B42318",
  "#B7791F",
  "#16855B",
] as const;

export const ISSUE_PRIORITIES = {
  low: { color: "bg-blue-500", label: "Low" },
  medium: { color: "bg-yellow-500", label: "Medium" },
  high: { color: "bg-orange-500", label: "High" },
  critical: { color: "bg-red-500", label: "Critical" },
} as const;

export const ISSUE_STATUSES = {
  open: { color: "bg-blue-500", label: "Open" },
  in_progress: { color: "bg-yellow-500", label: "In Progress" },
  resolved: { color: "bg-green-500", label: "Resolved" },
  closed: { color: "bg-gray-500", label: "Closed" },
} as const;

export const DEMO_BUILDINGS: Building[] = [
  {
    id: "b1",
    name: "Main Academic Block",
    code: "MAB",
    description: "Central academic block housing multiple departments",
    coordinates: { lat: 19.0881, lng: 72.8635 },
    floors: [],
    yearBuilt: 2015,
    department: "All",
    facilities: [],
    status: "operational",
  },
  {
    id: "b2",
    name: "Computer Science Building",
    code: "CSB",
    description: "State-of-the-art CS and IT laboratories",
    coordinates: { lat: 19.0878, lng: 72.8638 },
    floors: [],
    yearBuilt: 2018,
    department: "Computer Science",
    facilities: [],
    status: "operational",
  },
  {
    id: "b3",
    name: "Library & Learning Center",
    code: "LLC",
    description: "Central library with digital learning resources",
    coordinates: { lat: 19.0885, lng: 72.8632 },
    floors: [],
    yearBuilt: 2010,
    department: "Library",
    facilities: [],
    status: "operational",
  },
  {
    id: "b4",
    name: "Student Center",
    code: "STC",
    description: "Student amenities, cafeteria, and activity spaces",
    coordinates: { lat: 19.088, lng: 72.8645 },
    floors: [],
    yearBuilt: 2020,
    department: "Student Affairs",
    facilities: [],
    status: "operational",
  },
  {
    id: "b5",
    name: "Hostel Complex",
    code: "HST",
    description: "Residential accommodation for students",
    coordinates: { lat: 19.087, lng: 72.864 },
    floors: [],
    yearBuilt: 2012,
    department: "Residence Life",
    facilities: [],
    status: "operational",
  },
];

export const DEMO_LIFTS: Lift[] = [
  {
    id: "l1",
    buildingId: "b1",
    number: "L1",
    name: "Elevator L1",
    currentFloor: 1,
    direction: "idle",
    status: "operational",
    passengers: 4,
    capacity: 13,
  },
  {
    id: "l2",
    buildingId: "b1",
    number: "L2",
    name: "Elevator L2",
    currentFloor: 2,
    direction: "up",
    status: "operational",
    passengers: 7,
    capacity: 13,
  },
  {
    id: "l3",
    buildingId: "b2",
    number: "L1",
    name: "Elevator L1",
    currentFloor: 0,
    direction: "down",
    status: "maintenance",
    passengers: 0,
    capacity: 13,
  },
];

export const DEMO_EVENTS: Event[] = [
  {
    id: "e1",
    title: "AI & Machine Learning Workshop",
    description:
      "Hands-on workshop covering neural networks, NLP, and computer vision",
    type: "workshop",
    location: "CSB Auditorium",
    buildingId: "b2",
    coordinates: { lat: 19.0878, lng: 72.8638 },
    startDate: "2024-01-20T09:00:00Z",
    endDate: "2024-01-20T17:00:00Z",
    organizer: "Department of Computer Science",
    attendees: [],
    tags: ["AI", "ML", "workshop"],
    capacity: 100,
    status: "upcoming",
  },
  {
    id: "e2",
    title: "Tech Talk: Future of Web3",
    description: "Industry experts discuss the future of decentralized web",
    type: "seminar",
    location: "MAB Conference Hall",
    buildingId: "b1",
    coordinates: { lat: 19.0881, lng: 72.8635 },
    startDate: "2024-01-22T14:00:00Z",
    endDate: "2024-01-22T16:00:00Z",
    organizer: "IEEE Student Chapter",
    attendees: [],
    tags: ["web3", "blockchain", "tech"],
    capacity: 80,
    status: "upcoming",
  },
];

export const DEMO_COURSES: Course[] = [
  {
    id: "c1",
    code: "CS201",
    name: "Data Structures and Algorithms",
    description:
      "Study of data structures and algorithm design principles",
    credits: 4,
    department: "Computer Science",
    prerequisites: ["CS101"],
    learningOutcomes: [],
  },
  {
    id: "c2",
    code: "MA102",
    name: "Applied Mathematics",
    description: "Advanced mathematical concepts for engineering",
    credits: 3,
    department: "Mathematics",
    prerequisites: [],
    learningOutcomes: [],
  },
  {
    id: "c3",
    code: "EC201",
    name: "Digital Electronics",
    description: "Fundamentals of digital logic design",
    credits: 4,
    department: "Electronics",
    prerequisites: ["EC101"],
    learningOutcomes: [],
  },
];

export const DEMO_FACULTY: Faculty[] = [
  {
    id: "usr_001",
    email: "dr.smith@somaiya.edu",
    name: "Dr. Rajesh Smith",
    role: "faculty",
    status: "active",
    avatar: "https://i.pravatar.cc/150?img=1",
    phone: "+91-9876543210",
    createdAt: "2020-01-15T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
    facultyId: "FAC-001",
    employeeId: "EMP-2020-001",
    department: "Computer Science",
    designation: "Professor",
    joiningDate: "2020-01-15",
    specializations: ["Machine Learning", "Data Science"],
    officeLocation: "CSB-305",
    consultationHours: [],
    courses: [],
  },
];

export const DEMO_ROOMS: Room[] = [
  {
    id: "r1",
    floorId: "f1_1",
    buildingId: "b1",
    number: "101",
    name: "Hall 101",
    type: "classroom",
    capacity: 80,
    facilities: ["projector", "ac", "wifi"],
    coordinate: { x: 100, y: 200 },
    status: "available",
  },
  {
    id: "r2",
    floorId: "f1_1",
    buildingId: "b1",
    number: "102",
    name: "Hall 102",
    type: "classroom",
    capacity: 60,
    facilities: ["projector", "ac", "wifi"],
    coordinate: { x: 200, y: 200 },
    status: "occupied",
  },
];

export const ROUTES = {
  STUDENT: {
    DASHBOARD: "/student/dashboard",
    MY_DAY: "/student/my-day",
    MAP: "/student/map",
    PULSE: "/student/pulse",
    EXPLORE: "/student/explore",
     PORTFOLIO: "/student/portfolio",
    TOUR: "/student/tour",
    LOST_FOUND: "/student/lost-found",
    AI: "/student/ai",
    NOTIFICATIONS: "/student/notifications",
    PROFILE: "/student/profile",
    SETTINGS: "/student/settings",
    EVENTS: "/student/events",
    FACULTY: "/student/faculty",
  },
  FACULTY: {
    DASHBOARD: "/faculty/dashboard",
    SCHEDULE: "/faculty/schedule",
    CLASSES: "/faculty/classes",
    STUDENTS: "/faculty/students",
     AVAILABILITY: "/faculty/availability",
    AI: "/faculty/ai",
    TOUR: "/faculty/tour",
  },
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    DIGITAL_TWIN: "/admin/digital-twin",
    CONTROL_CENTER: "/admin/control-center",
    TOUR: "/admin/tour",
    ANALYTICS: "/admin/analytics",
    SIMULATION: "/admin/simulation",
    ISSUES: "/admin/issues",
    EVENTS: "/admin/events",
    USERS: "/admin/users",
    SETTINGS: "/admin/settings",
  },
  AUTH: {
    LOGIN: "/auth/login",
    CALLBACK: "/callback",
    LOGOUT: "/auth/login",
  },
} as const;

export const NAVIGATION_ITEMS = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: "LayoutDashboard" },
    { label: "My Day", href: "/student/my-day", icon: "Calendar" },
    { label: "Map", href: "/student/map", icon: "Map" },
    { label: "Pulse", href: "/student/pulse", icon: "Activity" },
    { label: "Explore", href: "/student/explore", icon: "Search" },
    { label: "Events", href: "/student/events", icon: "CalendarDays" },
    { label: "Faculty", href: "/student/faculty", icon: "Users" },
    { label: "Lost & Found", href: "/student/lost-found", icon: "Search" },
    { label: "NEXUS AI", href: "/student/ai", icon: "Brain" },
    { label: "Notifications", href: "/student/notifications", icon: "Bell" },
    { label: "Profile", href: "/student/profile", icon: "User" },
  ],
  faculty: [
    { label: "Dashboard", href: "/faculty/dashboard", icon: "LayoutDashboard" },
    { label: "Schedule", href: "/faculty/schedule", icon: "Calendar" },
    { label: "Classes", href: "/faculty/classes", icon: "BookOpen" },
    { label: "Students", href: "/faculty/students", icon: "GraduationCap" },
    { label: "Availability", href: "/faculty/availability", icon: "Clock" },
    { label: "NEXUS AI", href: "/faculty/ai", icon: "Brain" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
    { label: "Digital Twin", href: "/admin/digital-twin", icon: "Building" },
    { label: "Campus Control", href: "/admin/control-center", icon: "Gauge" },
    { label: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
    { label: "Simulation", href: "/admin/simulation", icon: "PlayCircle" },
    { label: "Issues", href: "/admin/issues", icon: "AlertCircle" },
    { label: "Events", href: "/admin/events", icon: "Calendar" },
    { label: "Users", href: "/admin/users", icon: "Users" },
    { label: "Students", href: "/admin/students", icon: "GraduationCap" },
    { label: "Faculty", href: "/admin/faculty", icon: "Users" },
    { label: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
} as const;

export const CROWD_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;

export const ISSUE_CATEGORIES = [
  "infrastructure",
  "it",
  "safety",
  "cleanliness",
  "cafeteria",
  "library",
  "other",
] as const;

export const ISSUE_CATEGORY_LABELS = {
  infrastructure: "Infrastructure",
  it: "IT Support",
  safety: "Safety",
  cleanliness: "Cleanliness",
  cafeteria: "Cafeteria",
  library: "Library",
  other: "Other",
} as const;

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const MAP_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const LOCATION_STATUS = {
  LIVE: { label: "LIVE", color: "text-emerald-400", bg: "bg-emerald-500" },
  OFF: { label: "OFF", color: "text-gray-400", bg: "bg-gray-500" },
  UNAVAILABLE: { label: "UNAVAILABLE", color: "text-amber-400", bg: "bg-amber-500" },
  PERMISSION_DENIED: { label: "PERMISSION DENIED", color: "text-red-400", bg: "bg-red-500" },
} as const;

export const RUSH_LEVELS = {
  LOW: { label: "Low", color: "text-green-400", bg: "bg-green-500", threshold: 0.3 },
  MODERATE: { label: "Moderate", color: "text-amber-400", bg: "bg-amber-500", threshold: 0.6 },
  HIGH: { label: "High", color: "text-orange-400", bg: "bg-orange-500", threshold: 0.85 },
  VERY_HIGH: { label: "Very High", color: "text-red-400", bg: "bg-red-500", threshold: 1.0 },
} as const;

export type LocationStatus = keyof typeof LOCATION_STATUS;
export type RushLevel = keyof typeof RUSH_LEVELS;

export interface LocationState {
  user_id: string;
  tracking_enabled: boolean;
  location_status: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp?: string;
  matched_location?: {
    id: number;
    name: string;
    distance_meters: number;
  } | null;
}

export interface CampusLocationInfo {
  id: number;
  name: string;
  location_type: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters?: number;
  capacity?: number;
  operational_status?: string;
  description?: string;
}

export interface RushInfo {
  location_id: number;
  location_name: string;
  current_count: number;
  capacity?: number;
  rush_level: string;
  confidence: number;
  source: string;
  override_reason?: string | null;
  expires_at?: string | null;
  last_updated: string;
}
