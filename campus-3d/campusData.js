/**
 * Campus-Nexus 3D Campus Data Repository
 * Centralized dataset defining coordinates, metadata, architectural parameters,
 * and cinematic camera focal positions for interactive university exploration.
 */

export const campusBuildings = [
  {
    id: "library",
    name: "William J. Nexus Central Library",
    shortName: "Library",
    code: "LIB-100",
    category: "Academic & Research",
    tagColor: "#38bdf8", // Sky blue
    coordinates: { x: -28, y: 0, z: -16 },
    dimensions: { width: 22, height: 16, depth: 18 },
    architecturalStyle: "Modern Glass Prism with Cantilevered Louvers",
    focalPoint: {
      camera: { x: -10, y: 16, z: 8 },
      target: { x: -28, y: 6, z: -16 }
    },
    overview:
      "The flagship intellectual heart of the campus housing over 800,000 volumes, state-of-the-art silent study pods, and 24/7 collaborative research studios overlooking the campus reflecting pool.",
    floors: 5,
    capacity: "2,400 students",
    builtYear: 2019,
    hours: "Open 24 Hours / 7 Days",
    status: "Open Now",
    statusType: "open",
    departments: [
      "Information & Digital Archives",
      "Scholarly Publishing Wing",
      "Graduate Research Center",
      "Academic Commons & Tutoring"
    ],
    facilities: [
      "24/7 Quiet Study Pods",
      "Rare Books & Manuscript Vault",
      "High-End Audio/Podcast Booths",
      "Virtual Reality Research Lab",
      "Artisan Espresso Bar & Lounge",
      "Automated Book Return Robots"
    ],
    contact: "library-desk@campusnexus.edu • Ext. 4101"
  },
  {
    id: "turing",
    name: "Alan Turing Engineering & AI Hall",
    shortName: "Turing Hall",
    code: "ENG-200",
    category: "Engineering & Technology",
    tagColor: "#818cf8", // Indigo
    coordinates: { x: 26, y: 0, z: -18 },
    dimensions: { width: 20, height: 20, depth: 22 },
    architecturalStyle: "High-Tech Brutalism with Integrated Solar Fins",
    focalPoint: {
      camera: { x: 10, y: 20, z: 6 },
      target: { x: 26, y: 8, z: -18 }
    },
    overview:
      "A high-performance computing nexus featuring cutting-edge artificial intelligence clusters, autonomous robotics testbeds, and makerspaces for hardware prototyping and drone simulation.",
    floors: 6,
    capacity: "1,850 students & researchers",
    builtYear: 2022,
    hours: "6:00 AM – Midnight (Keycard 24/7)",
    status: "Active Workstations Available",
    statusType: "open",
    departments: [
      "Department of Computer Science",
      "Robotics & Cyber-Physical Systems",
      "Quantum Information Research",
      "Software Engineering Institute"
    ],
    facilities: [
      "Nexus-1 Supercomputing Cluster (GPU Rack)",
      "Autonomous Drone Cage & Test Arena",
      "Cleanroom Fabrication Lab",
      "Cybersecurity Defense Center",
      "Rapid Hardware 3D Prototyping Bay",
      "NVIDIA Collaboration Center"
    ],
    contact: "turing-office@campusnexus.edu • Ext. 8200"
  },
  {
    id: "hive",
    name: "The Hive — Student Union & Commons",
    shortName: "The Hive",
    code: "STU-300",
    category: "Student Life & Dining",
    tagColor: "#fbbf24", // Amber
    coordinates: { x: 0, y: 0, z: 12 },
    dimensions: { width: 26, height: 13, depth: 24 },
    architecturalStyle: "Curvilinear Biophilic Pavilion with Rooftop Meadows",
    focalPoint: {
      camera: { x: -16, y: 15, z: 32 },
      target: { x: 0, y: 5, z: 12 }
    },
    overview:
      "The social epicenter of university life, designed with multi-level indoor amphitheaters, international artisan dining stalls, student governance suites, and startup incubator lounges.",
    floors: 4,
    capacity: "3,200 occupants",
    builtYear: 2021,
    hours: "7:00 AM – 1:00 AM Daily",
    status: "Peak Activity / Busy",
    statusType: "busy",
    departments: [
      "Student Affairs & Diversity Hub",
      "Campus Activity Board (CAB)",
      "Career Development & Venture Fund",
      "Wellness & Psychological Services"
    ],
    facilities: [
      "Multi-Cuisine Global Food Marketplace",
      "Student Venture Accelerator Incubator",
      "Esports & Console Gaming Lounge",
      "Panoramic Rooftop Greenhouse Garden",
      "Campus Bookstore & Merch Store",
      "ATM & Student Banking Concierge"
    ],
    contact: "studentlife@campusnexus.edu • Ext. 3310"
  },
  {
    id: "auditorium",
    name: "Symphony Grand Auditorium & Arts Center",
    shortName: "Auditorium",
    code: "ART-400",
    category: "Arts & Culture",
    tagColor: "#f472b6", // Rose pink
    coordinates: { x: -48, y: 0, z: 18 },
    dimensions: { width: 22, height: 17, depth: 24 },
    architecturalStyle: "Sculptural Copper-Clad Shell with Tuned Acoustics",
    focalPoint: {
      camera: { x: -30, y: 18, z: 38 },
      target: { x: -48, y: 6, z: 18 }
    },
    overview:
      "A 1,600-seat acoustic concert hall and dramatic performance complex engineered with motorized acoustic baffles, orchestra lift, and experimental black box theatre wings.",
    floors: 3,
    capacity: "1,600 concert seats",
    builtYear: 2017,
    hours: "8:00 AM – 10:00 PM (Event Specific)",
    status: "Rehearsal in Progress",
    statusType: "open",
    departments: [
      "School of Music & Performing Arts",
      "Digital Media Scenography",
      "Film Production & Sound Engineering"
    ],
    facilities: [
      "Main Concert Hall with Steinway Grand Pianos",
      "Experimental Black Box Theatre",
      "Dolby Atmos Sound Mixing Studio",
      "Costume & Scenery Fabrication Studio",
      "Private Practice Chambers",
      "Grand Foyer Exhibition Gallery"
    ],
    contact: "boxoffice@campusnexus.edu • Ext. 5050"
  },
  {
    id: "arena",
    name: "Falcon Arena & Athletic Complex",
    shortName: "Sports Arena",
    code: "ATH-500",
    category: "Athletics & Recreation",
    tagColor: "#34d399", // Emerald green
    coordinates: { x: 50, y: 0, z: 22 },
    dimensions: { width: 28, height: 15, depth: 32 },
    architecturalStyle: "Tensile Truss Aerodynamic Dome",
    focalPoint: {
      camera: { x: 30, y: 19, z: 42 },
      target: { x: 50, y: 6, z: 22 }
    },
    overview:
      "A comprehensive multi-sport fieldhouse boasting an Olympic 50m natatorium, NCAA standard hardwood basketball stadium, multi-pitch indoor turf, and sports medicine rehabilitation clinic.",
    floors: 3,
    capacity: "4,500 spectators",
    builtYear: 2016,
    hours: "6:00 AM – 11:00 PM Daily",
    status: "Open to Students & Members",
    statusType: "open",
    departments: [
      "Department of Intercollegiate Athletics",
      "Kinesiology & Human Performance",
      "Recreational Sports & Fitness"
    ],
    facilities: [
      "50m Olympic Competition Swimming Pool",
      "Hardwood Varsity Basketball Court",
      "3-Story Indoor Climbing Wall",
      "Biomechanics Performance Clinic",
      "CrossFit Conditioning & Free Weights Zone",
      "Hydrotherapy Recovery Spas"
    ],
    contact: "athletics@campusnexus.edu • Ext. 7700"
  },
  {
    id: "admin",
    name: "Founders Hall & University Administration",
    shortName: "Founders Hall",
    code: "ADM-001",
    category: "Administration & Heritage",
    tagColor: "#fb923c", // Warm orange
    coordinates: { x: 0, y: 0, z: -46 },
    dimensions: { width: 24, height: 18, depth: 20 },
    architecturalStyle: "Neoclassical Clock Tower with Limestone Accents",
    focalPoint: {
      camera: { x: 18, y: 20, z: -28 },
      target: { x: 0, y: 8, z: -46 }
    },
    overview:
      "The historic cornerstone of the university founded in 1928, housing the Office of the Chancellor, Admissions & Financial Aid bureau, and the Board of Regents historic council chamber.",
    floors: 4,
    capacity: "650 personnel / visitors",
    builtYear: 1928,
    hours: "8:30 AM – 5:00 PM (Mon-Fri)",
    status: "Open for Inquiries",
    statusType: "open",
    departments: [
      "Office of the Chancellor & Provost",
      "University Admissions & Registrar",
      "Student Financial Services",
      "Alumni Relations & Philanthropy"
    ],
    facilities: [
      "Historic Clock Tower Observation Deck",
      "Board of Regents Council Chamber",
      "Heritage Archives & Historical Museum",
      "Prospective Student Welcome Center",
      "Commencement Lawn Quadrangle",
      "Honors Convocation Hall"
    ],
    contact: "admissions@campusnexus.edu • Ext. 1000"
  },
  {
    id: "biotech",
    name: "Rosalind Franklin Bio-Medical Center",
    shortName: "Biotech Wing",
    code: "BIO-600",
    category: "Life Sciences & Medicine",
    tagColor: "#a855f7", // Purple
    coordinates: { x: -36, y: 0, z: -48 },
    dimensions: { width: 22, height: 15, depth: 20 },
    architecturalStyle: "Bioclimatic Glass Terraces & Modular Cleanrooms",
    focalPoint: {
      camera: { x: -18, y: 18, z: -30 },
      target: { x: -36, y: 6, z: -48 }
    },
    overview:
      "Interdisciplinary biotechnology research center dedicated to genomic sequencing, synthetic biology, nanotechnology drug delivery, and climate-resilient agricultural genomics.",
    floors: 5,
    capacity: "1,100 researchers",
    builtYear: 2023,
    hours: "7:00 AM – 9:00 PM (Keycard Access 24/7)",
    status: "Restricted Lab Access",
    statusType: "busy",
    departments: [
      "Department of Molecular Genetics",
      "Nanotechnology & Drug Delivery Institute",
      "Agricultural Biosystems Engineering",
      "Center for Precision Oncology"
    ],
    facilities: [
      "BSL-3 Biosafety Research Containment",
      "High-Throughput Gene Sequencer Suite",
      "Cryogenic Electron Microscope (Cryo-EM)",
      "Automated Hydroponic Research Greenhouse",
      "Bio-Imaging & Confocal Microscopy Core",
      "Analytical Mass Spectrometry Facility"
    ],
    contact: "biomed-admin@campusnexus.edu • Ext. 6200"
  },
  {
    id: "gate",
    name: "Nexus Memorial Grand Gateway & Plaza",
    shortName: "Main Entrance",
    code: "ENT-010",
    category: "Campus Portal & Transit",
    tagColor: "#2dd4bf", // Teal
    coordinates: { x: 0, y: 0, z: 62 },
    dimensions: { width: 28, height: 10, depth: 14 },
    architecturalStyle: "Sculptural Modernist Archway & Transit Esplanade",
    focalPoint: {
      camera: { x: 20, y: 14, z: 78 },
      target: { x: 0, y: 3, z: 62 }
    },
    overview:
      "The ceremonial entrance to the university campus featuring the kinetic Nexus Fountain, real-time electric shuttle transit interchange, and 24/7 visitor security kiosk.",
    floors: 1,
    capacity: "15,000 daily transit travelers",
    builtYear: 2020,
    hours: "Open 24/7",
    status: "Shuttles Running Every 6 Mins",
    statusType: "open",
    departments: [
      "Campus Safety & Parking Services",
      "University Transit & Mobility Center",
      "Visitor Welcome & Tour Kiosks"
    ],
    facilities: [
      "Autonomous Electric Shuttle Station",
      "Bicycle Sharing Hub & EV Fast Chargers",
      "Touchscreen Wayfinding Kiosks",
      "Memorial Kinetic Water Fountain",
      "Visitor Parking Lot A (300 Bays)",
      "Emergency Operations Kiosk"
    ],
    contact: "campuspolice@campusnexus.edu • Ext. 9111"
  }
];

/**
 * Camera View Presets for Fast Travel Navigation Dock
 */
export const cameraPresets = {
  overview: {
    name: "Overview (All)",
    camera: { x: 62, y: 55, z: 78 },
    target: { x: 0, y: 2, z: 0 },
    duration: 1.8
  },
  entrance: {
    name: "Main Entrance",
    camera: { x: 18, y: 14, z: 82 },
    target: { x: 0, y: 3, z: 62 },
    duration: 1.5
  },
  academic: {
    name: "Academic Quad",
    camera: { x: 4, y: 28, z: 16 },
    target: { x: 0, y: 5, z: -25 },
    duration: 1.6
  },
  library: {
    name: "Central Library",
    camera: { x: -10, y: 16, z: 8 },
    target: { x: -28, y: 6, z: -16 },
    duration: 1.4
  },
  turing: {
    name: "Turing Tech Hub",
    camera: { x: 10, y: 20, z: 6 },
    target: { x: 26, y: 8, z: -18 },
    duration: 1.4
  },
  studentLife: {
    name: "The Hive (Union)",
    camera: { x: -16, y: 15, z: 32 },
    target: { x: 0, y: 5, z: 12 },
    duration: 1.4
  },
  athletics: {
    name: "Sports Complex",
    camera: { x: 30, y: 19, z: 42 },
    target: { x: 50, y: 6, z: 22 },
    duration: 1.4
  }
};

/**
 * Lighting and Atmosphere Themes (Day / Sunset / Night)
 */
export const environmentThemes = {
  day: {
    name: "Daylight",
    skyColor: 0x7eb6f0,
    groundColor: 0x388e3c,
    fogColor: 0xbfe0fc,
    fogNear: 120,
    fogFar: 420,
    sunColor: 0xfffae8,
    sunIntensity: 3.2,
    sunPosition: { x: 80, y: 110, z: 60 },
    hemiSky: 0xe0f2fe,
    hemiGround: 0x86efac,
    hemiIntensity: 1.35,
    fillColor: 0xfef9c3,
    fillIntensity: 0.85,
    windowEmissiveIntensity: 0.25
  },
  sunset: {
    name: "Golden Hour",
    skyColor: 0xf5a57a,
    groundColor: 0x243b30,
    fogColor: 0xf6aa83,
    fogNear: 60,
    fogFar: 260,
    sunColor: 0xff8c42,
    sunIntensity: 2.2,
    sunPosition: { x: 120, y: 28, z: -60 },
    hemiSky: 0xffc499,
    hemiGround: 0x3d271d,
    hemiIntensity: 0.7,
    fillColor: 0x6e438c,
    fillIntensity: 0.5,
    windowEmissiveIntensity: 0.6
  },
  night: {
    name: "Midnight Cyber",
    skyColor: 0x070b14,
    groundColor: 0x0f1722,
    fogColor: 0x080d1a,
    fogNear: 45,
    fogFar: 230,
    sunColor: 0x4f6d9c,
    sunIntensity: 0.35,
    sunPosition: { x: 40, y: 80, z: 30 },
    hemiSky: 0x1a2942,
    hemiGround: 0x0b0e14,
    hemiIntensity: 0.4,
    fillColor: 0x2b385e,
    fillIntensity: 0.3,
    windowEmissiveIntensity: 1.4
  }
};
