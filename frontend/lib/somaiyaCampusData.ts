/**
 * Somaiya Vidyavihar University — 3D Digital Twin Spatial & Architectural Catalog
 * 
 * Centralized dataset defining 3D coordinates, building dimensions, architectural styles,
 * departments, facilities, live telemetry linkages, and cinematic camera focal points.
 */

export interface SomaiyaBuilding {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: string;
  tagColor: string; // Hex color for 3D marker & UI badges
  coordinates: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  architecturalStyle: string;
  focalPoint: {
    camera: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  overview: string;
  floors: number;
  capacity: string;
  builtYear: number;
  hours: string;
  status: string;
  statusType: "open" | "busy" | "closed";
  departments: string[];
  facilities: string[];
  contact: string;
}

export interface CameraPreset {
  name: string;
  camera: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  duration: number;
}

export interface EnvironmentTheme {
  name: string;
  skyColor: number;
  groundColor: number;
  plazaColor: number;
  roadColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: { x: number; y: number; z: number };
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  fillColor: number;
  fillIntensity: number;
  windowEmissiveIntensity: number;
  exposure: number;
}

export const somaiyaBuildings: SomaiyaBuilding[] = [
  {
    id: "ssbas",
    code: "SSBAS",
    name: "K. J. Somaiya College of Engineering (KJSCE) / SSBAS",
    shortName: "KJSCE (SSBAS)",
    category: "Engineering & Artificial Intelligence",
    tagColor: "#A51C30", // Somaiya Institutional Maroon
    coordinates: { x: 28, y: 0, z: -18 },
    dimensions: { width: 24, height: 20, depth: 22 },
    architecturalStyle: "Contemporary High-Tech Engineering Complex with Solar Fins",
    focalPoint: {
      camera: { x: 12, y: 22, z: 8 },
      target: { x: 28, y: 8, z: -18 }
    },
    overview:
      "The flagship engineering and technology epicenter of Somaiya Vidyavihar University, housing high-performance AI GPU computing clusters, robotics simulation arenas, advanced semiconductor design suites, and smart research laboratories.",
    floors: 4,
    capacity: "2,200 Students & Researchers",
    builtYear: 2012,
    hours: "7:30 AM – 9:00 PM (Authorized Labs 24/7)",
    status: "Active Workstations & Labs Open",
    statusType: "open",
    departments: [
      "Department of Computer Engineering",
      "Information Technology & Cloud Computing",
      "Artificial Intelligence & Machine Learning",
      "Electronics & Telecommunication Engineering",
      "Robotics & Cyber-Physical Systems Lab"
    ],
    facilities: [
      "Somaiya AI Supercomputing GPU Cluster",
      "Robotics Arena & Autonomous Drone Cage",
      "IoT Prototyping & Embedded Systems Lab",
      "Auditorium B-101 (350 Seats)",
      "Hardware Hacking & 3D Printing Bay",
      "Apple & NVIDIA Innovation Center"
    ],
    contact: "kjsce-helpdesk@somaiya.edu • Ext. 2100"
  },
  {
    id: "library",
    code: "LIB",
    name: "Somaiya Central Library (Granthagar)",
    shortName: "Central Library",
    category: "Academic Research & Learning Commons",
    tagColor: "#3B6EA5", // Somaiya Blue
    coordinates: { x: -28, y: 0, z: -16 },
    dimensions: { width: 22, height: 16, depth: 18 },
    architecturalStyle: "Sleek Glass Atrium with Cantilevered Reading Pavilions",
    focalPoint: {
      camera: { x: -10, y: 18, z: 10 },
      target: { x: -28, y: 6, z: -16 }
    },
    overview:
      "A vast three-story academic sanctuary overlooking the central campus quad. Features quiet study pods, high-speed digital research terminals, automated RFID lending kiosks, and a climate-controlled rare heritage manuscript archive.",
    floors: 3,
    capacity: "1,200 Quiet Study Seats",
    builtYear: 2015,
    hours: "Open 24 Hours / 7 Days (Reading Hall)",
    status: "Quiet Study Pods Available",
    statusType: "open",
    departments: [
      "University Information & Library Services",
      "Digital Knowledge Repository & E-Journals",
      "Graduate Research & Thesis Archive",
      "Somaiya Center for Indic Studies Archives"
    ],
    facilities: [
      "24/7 Silent Reading Halls with Acoustic Baffles",
      "Rare Books & Sanskrit Heritage Manuscript Vault",
      "Collaborative Multimedia Discussion Rooms",
      "High-Speed E-Resource Research Terminals",
      "Artisan Coffee Corner & Lounge"
    ],
    contact: "library@somaiya.edu • Ext. 1100"
  },
  {
    id: "aurobindo",
    code: "AURO",
    name: "Sri Aurobindo Academic Building",
    shortName: "Aurobindo",
    category: "Academics & Faculty Chambers",
    tagColor: "#f59e0b", // Warm Amber
    coordinates: { x: 30, y: 0, z: 20 },
    dimensions: { width: 22, height: 17, depth: 20 },
    architecturalStyle: "Modular Academic Terraces with Vertical Shading Louvers",
    focalPoint: {
      camera: { x: 12, y: 19, z: 40 },
      target: { x: 30, y: 7, z: 20 }
    },
    overview:
      "Houses multi-tier lecture theaters, faculty research suites, conference chambers, and the university academic advisory office. Known for its airy central courtyard and collaborative seminar spaces.",
    floors: 4,
    capacity: "1,600 Occupants",
    builtYear: 2014,
    hours: "8:00 AM – 7:30 PM",
    status: "Lectures & Seminars in Session",
    statusType: "open",
    departments: [
      "Department of Mathematics & Analytics",
      "Humanities, Languages & Cultural Studies",
      "Faculty Dean & Academic Council Secretariat",
      "Training & Placement Cell"
    ],
    facilities: [
      "Smart Interactive Lecture Theatres 101–108",
      "Faculty Cabin Chambers & Consultation Suites",
      "High-Speed Passenger Elevators",
      "Conference Room with Dolby Sound Conferencing"
    ],
    contact: "aurobindo.office@somaiya.edu • Ext. 3100"
  },
  {
    id: "bhaskaracharya",
    code: "BHAK",
    name: "Bhaskaracharya Academic Complex",
    shortName: "Bhaskaracharya",
    category: "Sciences, Labs & Lecture Halls",
    tagColor: "#8b5cf6", // Violet
    coordinates: { x: -30, y: 0, z: 22 },
    dimensions: { width: 24, height: 19, depth: 22 },
    architecturalStyle: "Modernist Tiered Block with Cantilevered Auditoriums",
    focalPoint: {
      camera: { x: -12, y: 20, z: 42 },
      target: { x: -30, y: 8, z: 22 }
    },
    overview:
      "A prominent five-story academic block dedicated to basic sciences, computing research, and multi-disciplinary workshops. Features the grand Auditorium 301 and high-capacity multi-utility hall 506.",
    floors: 5,
    capacity: "2,800 Students",
    builtYear: 2016,
    hours: "8:00 AM – 8:00 PM",
    status: "Classrooms & Wet Labs Operational",
    statusType: "open",
    departments: [
      "Department of Applied Physics",
      "Department of Chemical Sciences & Nanotech",
      "Environmental Studies & Sustainability Wing",
      "Postgraduate Studies & Research Center"
    ],
    facilities: [
      "Grand Auditorium 301 (500 Seats)",
      "Multi-Utility Hall 506 (Examinations & Symposia)",
      "Spectroscopy & Analytical Instrumentation Core",
      "Computer Science Project Rooms"
    ],
    contact: "bhaskaracharya@somaiya.edu • Ext. 4200"
  },
  {
    id: "canteen",
    code: "CANT",
    name: "Somaiya Central Canteen & Food Court",
    shortName: "Campus Canteen",
    category: "Student Life & Dining",
    tagColor: "#10b981", // Emerald Green
    coordinates: { x: 0, y: 0, z: 10 },
    dimensions: { width: 26, height: 12, depth: 22 },
    architecturalStyle: "Open-Air Pavilion with Pergola Dining Terraces",
    focalPoint: {
      camera: { x: -16, y: 15, z: 32 },
      target: { x: 0, y: 4, z: 10 }
    },
    overview:
      "The energetic social hub of Vidyavihar campus. World-famous for its crispy Somaiya Frankies, fresh Maggi point, South Indian breakfast, and breezy outdoor dining under tree canopies.",
    floors: 2,
    capacity: "950 Diners",
    builtYear: 2018,
    hours: "7:00 AM – 9:30 PM Daily",
    status: "High Rush • Frankie Counter Active",
    statusType: "busy",
    departments: [
      "Somaiya Hospitality & Dining Services",
      "Student Activity & Buzz Square"
    ],
    facilities: [
      "Legendary Somaiya Frankie Counter",
      "Quick-Service Maggi & Chaat Corner",
      "Fresh Fruit Juice & Cold Pressed Shakes",
      "Artisan Nescafe Coffee Kiosk",
      "Spacious Shaded Pergola Seating"
    ],
    contact: "canteen-concierge@somaiya.edu"
  },
  {
    id: "gargi",
    code: "GARG",
    name: "Gargi Plaza & Open-Air Amphitheatre",
    shortName: "Gargi Plaza",
    category: "Culture, Arts & Public Arena",
    tagColor: "#ec4899", // Pink
    coordinates: { x: 0, y: 0, z: -46 },
    dimensions: { width: 28, height: 14, depth: 20 },
    architecturalStyle: "Tiered Circular Amphitheatre with Acoustic Reflectors",
    focalPoint: {
      camera: { x: 18, y: 18, z: -28 },
      target: { x: 0, y: 5, z: -46 }
    },
    overview:
      "The cultural epicenter of the campus hosting annual festivals like Symphony, technical hackathons, convocation ceremonies, theatrical plays, and open-mic musical evenings.",
    floors: 2,
    capacity: "3,500 Spectators",
    builtYear: 2017,
    hours: "Open for Campus Life & Scheduled Events",
    status: "Event Venue Open",
    statusType: "open",
    departments: [
      "Somaiya Cultural Forum",
      "Student Council Executive Office",
      "Literary & Dramatics Society"
    ],
    facilities: [
      "Acoustic Semicircular Amphitheatre",
      "Professional Rigged Stage with Stage Lighting",
      "Green Rooms & Dressing Chambers",
      "Central Promenade Walkway & Fountain",
      "Open Exhibition Quad"
    ],
    contact: "cultural@somaiya.edu • Ext. 5500"
  },
  {
    id: "sports",
    code: "SPRT",
    name: "Somaiya Sports Academy & Gymkhana",
    shortName: "Sports Academy",
    category: "Athletics, Fitness & Recreation",
    tagColor: "#06b6d4", // Cyan
    coordinates: { x: -48, y: 0, z: -45 },
    dimensions: { width: 28, height: 15, depth: 30 },
    architecturalStyle: "Aerodynamic Steel Truss Fieldhouse & Pavilion",
    focalPoint: {
      camera: { x: -28, y: 19, z: -25 },
      target: { x: -48, y: 6, z: -45 }
    },
    overview:
      "State-of-the-art sports complex offering international standard turf fields, athletic tracks, a fully equipped gymnasium, and professional sports coaching for Somaiya athletes.",
    floors: 2,
    capacity: "4,500 Spectators",
    builtYear: 2019,
    hours: "6:00 AM – 10:00 PM Daily",
    status: "Turf & Gymnasium Open",
    statusType: "open",
    departments: [
      "Department of Physical Education",
      "Somaiya Sports Council",
      "Sports Medicine & Physiotherapy Clinic"
    ],
    facilities: [
      "Full-Size FIFA-Standard Football Turf",
      "Olympic 400m Synthetic Running Track",
      "Floodlit Cricket Pitch with Practice Nets",
      "Wooden Hardwood Badminton & Squash Courts",
      "CrossFit Conditioning Center & Sauna"
    ],
    contact: "sports@somaiya.edu • Ext. 7700"
  },
  {
    id: "gate",
    code: "GATE",
    name: "Somaiya Vidyavihar Ceremonial Main Gate",
    shortName: "Vidyavihar Gate",
    category: "Transit Hub & Welcome Center",
    tagColor: "#14b8a6", // Teal
    coordinates: { x: 0, y: 0, z: 62 },
    dimensions: { width: 26, height: 10, depth: 14 },
    architecturalStyle: "Iconic Monumental Arch with Automated Turnstiles",
    focalPoint: {
      camera: { x: 18, y: 14, z: 80 },
      target: { x: 0, y: 3, z: 62 }
    },
    overview:
      "The ceremonial entrance to Somaiya Vidyavihar campus on Vidyavihar East station road. Features 24/7 security monitoring, electric shuttle interchange, and visitor greeting kiosk.",
    floors: 1,
    capacity: "15,000 Daily Commuters",
    builtYear: 2015,
    hours: "Open 24/7",
    status: "Campus Shuttles Active",
    statusType: "open",
    departments: [
      "Campus Safety & Security Command",
      "Somaiya Transit & Shuttle Services",
      "Visitor Welcome & Tour Kiosk"
    ],
    facilities: [
      "Automated RFID Vehicle Barriers & Turnstiles",
      "Electric Campus Shuttle Station",
      "Visitor Pass Desk & Security Concierge",
      "EV Fast Charging Stations & Cycle Sharing"
    ],
    contact: "security@somaiya.edu • Ext. 9111"
  }
];

export const somaiyaCameraPresets: Record<string, CameraPreset> = {
  overview: {
    name: "Campus Overview",
    camera: { x: 62, y: 56, z: 76 },
    target: { x: 0, y: 2, z: 0 },
    duration: 1.8
  },
  gate: {
    name: "Main Gate",
    camera: { x: 18, y: 14, z: 80 },
    target: { x: 0, y: 3, z: 62 },
    duration: 1.5
  },
  academic: {
    name: "Academic Quad",
    camera: { x: 4, y: 28, z: 16 },
    target: { x: 0, y: 5, z: -15 },
    duration: 1.6
  },
  ssbas: {
    name: "KJSCE (SSBAS)",
    camera: { x: 12, y: 22, z: 8 },
    target: { x: 28, y: 8, z: -18 },
    duration: 1.4
  },
  library: {
    name: "Central Library",
    camera: { x: -10, y: 18, z: 10 },
    target: { x: -28, y: 6, z: -16 },
    duration: 1.4
  },
  canteen: {
    name: "Canteen & Food Court",
    camera: { x: -16, y: 15, z: 32 },
    target: { x: 0, y: 4, z: 10 },
    duration: 1.4
  },
  sports: {
    name: "Sports Academy",
    camera: { x: -28, y: 19, z: -25 },
    target: { x: -48, y: 6, z: -45 },
    duration: 1.4
  }
};

export const somaiyaEnvironmentThemes: Record<string, EnvironmentTheme> = {
  day: {
    name: "Daylight",
    skyColor: 0x5ba4e5, // Radiant sunny blue sky
    groundColor: 0x2e7d44, // Lush, fresh Somaiya campus green lawn
    plazaColor: 0xded8ce, // Warm architectural sandstone plaza pavers
    roadColor: 0x5a6578, // Clean light campus avenue asphalt
    fogColor: 0xaecdf0, // Soft sunny atmospheric haze near horizon
    fogNear: 140,
    fogFar: 440,
    sunColor: 0xfffae8, // Warm natural tropical sun
    sunIntensity: 3.4, // Brilliant daylight radiance
    sunPosition: { x: 85, y: 115, z: 65 },
    hemiSky: 0xe0f2fe, // Luminous blue sky ambient bounce
    hemiGround: 0x86efac, // Vibrant ground bounce to eliminate dark shadows
    hemiIntensity: 1.45,
    fillColor: 0xfef9c3, // Soft warm golden fill
    fillIntensity: 0.9,
    windowEmissiveIntensity: 0.25,
    exposure: 1.35
  },
  sunset: {
    name: "Golden Hour",
    skyColor: 0xb4533b, // Warm sunset amber sky
    groundColor: 0x3d503b, // Dusk warm greenery
    plazaColor: 0xab9585, // Sunset sandstone
    roadColor: 0x3f3d4d,
    fogColor: 0xc46950, // Golden hour haze
    fogNear: 90,
    fogFar: 360,
    sunColor: 0xf97316,
    sunIntensity: 2.8,
    sunPosition: { x: 120, y: 35, z: -60 },
    hemiSky: 0xfde68a,
    hemiGround: 0x5c3324,
    hemiIntensity: 1.0,
    fillColor: 0xa51c30,
    fillIntensity: 0.7,
    windowEmissiveIntensity: 0.7,
    exposure: 1.2
  },
  night: {
    name: "Cyber Midnight",
    skyColor: 0x080e1a,
    groundColor: 0x0d1c18,
    plazaColor: 0x141a29,
    roadColor: 0x0f1523,
    fogColor: 0x0a1324,
    fogNear: 60,
    fogFar: 280,
    sunColor: 0x38bdf8,
    sunIntensity: 0.6,
    sunPosition: { x: 40, y: 80, z: 30 },
    hemiSky: 0x1e293b,
    hemiGround: 0x0a151b,
    hemiIntensity: 0.55,
    fillColor: 0xa51c30,
    fillIntensity: 0.45,
    windowEmissiveIntensity: 1.8,
    exposure: 1.05
  }
};
