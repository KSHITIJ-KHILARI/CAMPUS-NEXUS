import {
  Building,
  Floor,
  Room,
  Classroom,
  Laboratory,
  Equipment,
  Facility,
  Course,
  CourseSection,
  Faculty,
  Student,
  ScheduleEntry,
  Timetable,
  Lift,
  CrowdState,
  Event,
  Issue,
  LostItem,
  FoundItem,
} from "./types";
import { DEMO_BUILDINGS, DEMO_LIFTS, DEMO_EVENTS, DEMO_COURSES, DEMO_FACULTY, DEMO_ROOMS } from "./constants";

export {
  DEMO_BUILDINGS,
  DEMO_LIFTS,
  DEMO_EVENTS,
  DEMO_COURSES,
  DEMO_FACULTY,
  DEMO_ROOMS,
};

export function getBuildingById(id: string): Building | undefined {
  return DEMO_BUILDINGS.find((b) => b.id === id);
}

export function getFloorById(id: string): Floor | undefined {
  return DEMO_BUILDINGS.flatMap((b) => b.floors).find((f) => f.id === id);
}

export function getRoomById(id: string): Room | undefined {
  for (const building of DEMO_BUILDINGS) {
    for (const floor of building.floors) {
      const room = floor.rooms.find((r) => r.id === id);
      if (room) return room;
    }
  }
  return DEMO_ROOMS.find((r) => r.id === id);
}

export function getRoomsByBuilding(buildingId: string): Room[] {
  for (const building of DEMO_BUILDINGS) {
    if (building.id === buildingId) {
      return building.floors.flatMap((f) => f.rooms);
    }
  }
  return DEMO_ROOMS.filter((r) => r.buildingId === buildingId);
}

export function getLiftsByBuilding(buildingId: string): Lift[] {
  return DEMO_LIFTS.filter((l) => l.buildingId === buildingId);
}

export function getCoursesByDepartment(dept: string): Course[] {
  return DEMO_COURSES.filter((c) => c.department === dept);
}

export function getDemoStudent(): Student {
  return {
    id: "usr_002",
    email: "alex.rose@somaiya.edu",
    name: "Alex Rose",
    role: "student",
    status: "active",
    avatar: "https://i.pravatar.cc/150?img=32",
    phone: "+91-9876543211",
    createdAt: "2022-08-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
    studentId: "STU-2022-001",
    universityRollNumber: "20231001",
    enrollmentNumber: "ENR-2022-CS-001",
    program: "B.Tech Computer Science",
    department: "Computer Science",
    year: 3,
    semester: 5,
    batch: "2023",
    guardianContact: "+91-9876543212",
    hostel: "Sunrise Hostel",
    roomNumber: "A-305",
    courses: [],
    timetable: getDemoTimetable(),
  };
}

export function getDemoFaculty(): Faculty {
  return DEMO_FACULTY[0];
}

export function getDemoTimetable(): Timetable {
  return {
    id: "tt_001",
    userId: "usr_002",
    entries: [
      {
        id: "se_1",
        courseSectionId: "cs201_s1",
        courseCode: "CS201",
        courseName: "Data Structures and Algorithms",
        faculty: "Dr. Rajesh Smith",
        roomId: "r1",
        buildingId: "b1",
        day: "monday",
        startTime: "09:00",
        endTime: "10:30",
        type: "lecture",
        recurrence: "weekly",
      },
      {
        id: "se_2",
        courseSectionId: "ma102_s1",
        courseCode: "MA102",
        courseName: "Applied Mathematics",
        faculty: "Prof. Meena Patel",
        roomId: "r2",
        buildingId: "b1",
        day: "monday",
        startTime: "11:00",
        endTime: "12:00",
        type: "lecture",
        recurrence: "weekly",
      },
      {
        id: "se_3",
        courseSectionId: "ec201_s1",
        courseCode: "EC201",
        courseName: "Digital Electronics",
        faculty: "Dr. Anil Kumar",
        roomId: "r3",
        buildingId: "b2",
        day: "tuesday",
        startTime: "14:00",
        endTime: "15:30",
        type: "lab",
        recurrence: "biweekly",
      },
      {
        id: "se_4",
        courseSectionId: "c1_s1",
        courseCode: "CS201",
        courseName: "Data Structures and Algorithms",
        faculty: "Dr. Rajesh Smith",
        roomId: "r1",
        buildingId: "b1",
        day: "wednesday",
        startTime: "10:00",
        endTime: "11:30",
        type: "lecture",
        recurrence: "weekly",
      },
      {
        id: "se_5",
        courseSectionId: "c2_s1",
        courseCode: "MA102",
        courseName: "Applied Mathematics",
        faculty: "Prof. Meena Patel",
        roomId: "r2",
        buildingId: "b1",
        day: "thursday",
        startTime: "13:00",
        endTime: "14:00",
        type: "tutorial",
        recurrence: "weekly",
      },
      {
        id: "se_6",
        courseSectionId: "c3_s1",
        courseCode: "EC201",
        courseName: "Digital Electronics",
        faculty: "Dr. Anil Kumar",
        roomId: "r4",
        buildingId: "b2",
        day: "friday",
        startTime: "15:00",
        endTime: "16:30",
        type: "lecture",
        recurrence: "weekly",
      },
    ],
    lastUpdated: "2024-01-15T06:00:00Z",
  };
}

export function getDemoBuildings(): Building[] {
  return DEMO_BUILDINGS;
}

export function getDemoLifts(): Lift[] {
  return DEMO_LIFTS;
}

export function getDemoEvents(): Event[] {
  return DEMO_EVENTS;
}

export function getDemoIssues(): Issue[] {
  return [
    {
      id: "iss_1",
      title: "AC Not Working in Room 204",
      description: "Air conditioning in Room 204, CS Building has been not working since yesterday morning.",
      category: "infrastructure",
      priority: "high",
      status: "open",
      location: { buildingId: "b2", roomId: "r3" },
      reporterId: "usr_002",
      assigneeId: "FAC-001",
      comments: [],
      createdAt: "2024-01-10T10:30:00Z",
      updatedAt: "2024-01-10T10:30:00Z",
      media: [],
    },
    {
      id: "iss_2",
      title: "Projector in Hall 101 Not Displaying",
      description: "The projector in Hall 101 is not displaying any output despite being powered on.",
      category: "it",
      priority: "medium",
      status: "in_progress",
      location: { buildingId: "b1", roomId: "r1" },
      reporterId: "usr_002",
      assigneeId: undefined,
      comments: [
        {
          id: "c1",
          issueId: "iss_2",
          authorId: "FAC-001",
          authorName: "Dr. Rajesh Smith",
          content: "Checking with IT department. Will update soon.",
          createdAt: "2024-01-09T14:00:00Z",
          isInternal: true,
        },
      ],
      createdAt: "2024-01-08T09:15:00Z",
      updatedAt: "2024-01-09T14:00:00Z",
      media: [],
    },
  ];
}

export function getDemoLostItems(): LostItem[] {
  return [
    {
      id: "lost_1",
      title: "Lost AirPods Pro",
      description: "Black AirPods Pro in white case. Last seen near the library entrance.",
      category: "electronics",
      location: "Library Entrance",
      dateLost: "2024-01-12T10:00:00Z",
      reporterId: "usr_002",
      reporterName: "Alex Rose",
      status: "lost",
    },
  ];
}

export function getDemoFoundItems(): FoundItem[] {
  return [
    {
      id: "found_1",
      title: "Found: Black Umbrella",
      description: "Black umbrella found near Student Center.",
      category: "accessories",
      location: "Student Center",
      dateFound: "2024-01-15T12:30:00Z",
      finderId: "usr_002",
      finderName: "Alex Rose",
      status: "reported",
    },
  ];
}

export function getDemoCrowdState(): CrowdState[] {
  return [
    {
      locationId: "b1",
      locationType: "building",
      level: "medium",
      count: 120,
      capacity: 300,
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    },
    {
      locationId: "b2",
      locationType: "building",
      level: "high",
      count: 85,
      capacity: 100,
      trend: "increasing",
      lastUpdated: new Date().toISOString(),
    },
    {
      locationId: "b3",
      locationType: "building",
      level: "low",
      count: 45,
      capacity: 200,
      trend: "decreasing",
      lastUpdated: new Date().toISOString(),
    },
    {
      locationId: "b4",
      locationType: "building",
      level: "low",
      count: 30,
      capacity: 150,
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    },
    {
      locationId: "b5",
      locationType: "building",
      level: "low",
      count: 20,
      capacity: 250,
      trend: "stable",
      lastUpdated: new Date().toISOString(),
    },
  ];
}

export function getCrowdLevel(occupancy: number): "low" | "medium" | "high" | "critical" {
  const ratio = occupancy;
  if (ratio < 0.3) return "low";
  if (ratio < 0.6) return "medium";
  if (ratio < 0.85) return "high";
  return "critical";
}
