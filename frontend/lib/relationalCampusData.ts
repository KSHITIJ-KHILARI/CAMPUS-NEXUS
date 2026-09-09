/**
 * Somaiya Vidyavihar University — Centralized Relational Campus Dataset
 * 
 * Provides relational structures connecting:
 * - Students ↔ Courses & Sections ↔ Faculty
 * - Timetable Sessions (Mon–Fri with 15-min granularity & locking behavior)
 * - Classroom Study Materials (Notes, Slides, PDFs)
 * - Vacant Rooms cross-referenced with real-time timetable
 * - Campus Events & Central Notifications
 */

export interface StudentProfile {
  student_id: string;
  student_id_number: string;
  full_name: string;
  name: string;
  email: string;
  avatar: string;
  program: string;
  department: string;
  semester: number;
  academic_year: string;
  cgpa: number;
  total_credits: number;
  attendance_percentage: number;
  bio: string;
  skills: string[];
  enrolled_courses: string[]; // Course IDs
  assigned_faculty_ids: string[];
  attendance_history: Array<{
    course_id: string;
    course_name: string;
    total_classes: number;
    attended_classes: number;
    percentage: number;
  }>;
  projects: Array<{
    id: string;
    title: string;
    role: string;
    tech: string;
    description: string;
    github?: string;
    live_url?: string;
    featured: boolean;
  }>;
  internships: Array<{
    id: string;
    company: string;
    role: string;
    duration: string;
    location: string;
    description: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    role: string;
    duration: string;
    description: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issue_date: string;
    credential_id?: string;
  }>;
}

export interface FacultyMember {
  id: string;
  faculty_id: string;
  name: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  avatar: string;
  office_location: string;
  office_hours: string;
  qualifications: string;
  specialization: string[];
  teaching_courses: string[]; // Course IDs
  is_available: boolean;
  manual_status?: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE";
  bio: string;
  phone: string;
}

export interface CourseData {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  description: string;
  faculty_id: string;
  enrolled_student_ids: string[];
  color: string;
  semester: number;
}

export interface TimetableSlot {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  faculty_id: string;
  faculty_name: string;
  room_id: string;
  room_number: string;
  building: string;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  start_time: string; // "09:00"
  end_time: string;   // "10:30"
  type: "lecture" | "lab" | "tutorial" | "personal";
  is_locked: boolean;
  is_cancelled: boolean;
  cancellation_reason?: string;
  cancellation_date?: string;
  color?: string;
  user_id?: string; // For personal schedule items
}

export interface CampusRoom {
  id: string;
  building_id: string;
  building_name: string;
  room_number: string;
  name: string;
  floor: number;
  capacity: number;
  type: "classroom" | "laboratory" | "seminar_hall" | "auditorium" | "study_pod";
  facilities: string[];
}

export interface ClassroomMaterial {
  id: string;
  course_id: string;
  course_code: string;
  title: string;
  description: string;
  unit: string;
  file_type: "pdf" | "slides" | "notes" | "code";
  file_size: string;
  file_url: string;
  upload_date: string;
  uploaded_by_faculty_id: string;
  uploaded_by_name: string;
  preview_text?: string;
}

export interface UniversityEvent {
  id: string;
  title: string;
  description: string;
  category: "hackathon" | "cultural" | "academic" | "sports" | "workshop";
  location: string;
  start_time: string;
  end_time: string;
  date: string;
  banner_color: string;
  capacity: number;
  registrations: number;
  is_registered?: boolean;
  status: "upcoming" | "live" | "completed";
}

// -------------------------------------------------------------
// 1. 5 Full Student Profiles
// -------------------------------------------------------------
export const initialStudents: StudentProfile[] = [
  {
    student_id: "stu-101",
    student_id_number: "STU-2023-101",
    full_name: "Aarav Mehta",
    name: "Aarav Mehta",
    email: "aarav.mehta@somaiya.edu",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    program: "B.Tech Computer Engineering",
    department: "Computer Engineering",
    semester: 4,
    academic_year: "2024–2025",
    cgpa: 9.24,
    total_credits: 78,
    attendance_percentage: 92,
    bio: "Undergraduate student passionate about distributed systems, computer vision, and autonomous robotics. Student Lead at KJSCE Robotics & AI Chapter.",
    skills: ["Python", "TypeScript", "C++", "PyTorch", "Next.js", "PostgreSQL", "Docker", "ROS2"],
    enrolled_courses: ["course-cs301", "course-cs401", "course-it201"],
    assigned_faculty_ids: ["fac-smith", "fac-sharma", "fac-iyer"],
    attendance_history: [
      { course_id: "course-cs301", course_name: "Database Management Systems", total_classes: 32, attended_classes: 30, percentage: 94 },
      { course_id: "course-cs401", course_name: "Machine Learning & AI", total_classes: 28, attended_classes: 26, percentage: 93 },
      { course_id: "course-it201", course_name: "Data Structures & Algorithms", total_classes: 30, attended_classes: 27, percentage: 90 },
    ],
    projects: [
      {
        id: "proj-1",
        title: "Autonomous Quadruped Robot Navigation",
        role: "Robotics Firmware Lead",
        tech: "ROS2, C++, PyTorch, LiDAR",
        description: "Implemented real-time SLAM and obstacle avoidance algorithms for quadrupeds navigating indoor multi-story academic buildings.",
        github: "https://github.com/somaiya/quadruped-nav",
        featured: true,
      },
      {
        id: "proj-2",
        title: "Campus Nexus Spatial Digital Twin",
        role: "Full-Stack & WebGL Developer",
        tech: "Three.js, Next.js, FastAPI, PostgreSQL",
        description: "Interactive real-time 3D telemetry visualization of Somaiya Vidyavihar campus with geofencing and dynamic routing.",
        github: "https://github.com/somaiya/campus-nexus",
        live_url: "https://campus-nexus.somaiya.edu",
        featured: true,
      }
    ],
    internships: [
      {
        id: "intern-1",
        company: "Somaiya Research Innovation Center",
        role: "AI Research Intern",
        duration: "May 2024 – July 2024",
        location: "Mumbai, India",
        description: "Developed transformer-based time-series forecasting for campus energy optimization across 8 academic blocks.",
      }
    ],
    clubs: [
      {
        id: "club-1",
        name: "KJSCE Robotics & AI Chapter",
        role: "Vice President (Technical)",
        duration: "2023 – Present",
        description: "Leading 45 student engineers in inter-college robotics competitions and autonomous rover workshops.",
      },
      {
        id: "club-2",
        name: "Somaiya Open Source Society",
        role: "Core Contributor",
        duration: "2023 – Present",
        description: "Maintaining community packages and organizing annual 24-hour hackathons.",
      }
    ],
    certifications: [
      {
        id: "cert-1",
        name: "Deep Learning Specialization",
        issuer: "DeepLearning.AI",
        issue_date: "Jan 2024",
        credential_id: "DL-AI-94821",
      },
      {
        id: "cert-2",
        name: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        issue_date: "Nov 2023",
        credential_id: "AWS-CCP-10492",
      }
    ]
  },
  {
    student_id: "stu-102",
    student_id_number: "STU-2023-102",
    full_name: "Diya Sen",
    name: "Diya Sen",
    email: "diya.sen@somaiya.edu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    program: "B.Tech Information Technology",
    department: "Information Technology",
    semester: 4,
    academic_year: "2024–2025",
    cgpa: 8.95,
    total_credits: 78,
    attendance_percentage: 88,
    bio: "Passionate cybersecurity enthusiast and full-stack engineer. Exploring cryptographic protocols, zero-trust architectures, and cloud security.",
    skills: ["Golang", "TypeScript", "React", "Linux", "Kubernetes", "Solidity", "Network Security"],
    enrolled_courses: ["course-cs301", "course-it201", "course-ec302"],
    assigned_faculty_ids: ["fac-smith", "fac-iyer", "fac-joshi"],
    attendance_history: [
      { course_id: "course-cs301", course_name: "Database Management Systems", total_classes: 32, attended_classes: 28, percentage: 87.5 },
      { course_id: "course-it201", course_name: "Data Structures & Algorithms", total_classes: 30, attended_classes: 27, percentage: 90 },
      { course_id: "course-ec302", course_name: "Microprocessors & Embedded Systems", total_classes: 26, attended_classes: 23, percentage: 88.5 },
    ],
    projects: [
      {
        id: "proj-3",
        title: "Zero-Knowledge Student Credentials",
        role: "Lead Protocol Engineer",
        tech: "zk-SNARKs, Solidity, Next.js",
        description: "Verifiable digital credential issuance for university degrees without revealing sensitive student PII.",
        featured: true,
      }
    ],
    internships: [
      {
        id: "intern-2",
        company: "Tata Consultancy Services (CyberLab)",
        role: "Security Analyst Intern",
        duration: "June 2024 – August 2024",
        location: "Mumbai, India",
        description: "Conducted automated vulnerability scans and static analysis across production microservices.",
      }
    ],
    clubs: [
      {
        id: "club-3",
        name: "KJSCE CyberSec Defense Guild",
        role: "Event Coordinator",
        duration: "2023 – Present",
        description: "Organizing bi-weekly Capture-The-Flag (CTF) security tournaments.",
      }
    ],
    certifications: [
      {
        id: "cert-3",
        name: "CompTIA Security+",
        issuer: "CompTIA",
        issue_date: "Feb 2024",
      }
    ]
  },
  {
    student_id: "stu-103",
    student_id_number: "STU-2022-085",
    full_name: "Rohan Patil",
    name: "Rohan Patil",
    email: "rohan.patil@somaiya.edu",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    program: "B.Tech Computer Engineering",
    department: "Computer Engineering",
    semester: 6,
    academic_year: "2024–2025",
    cgpa: 9.42,
    total_credits: 114,
    attendance_percentage: 95,
    bio: "Candidate Master on Codeforces (Rating 1940). Interested in high-frequency algorithmic systems, operating system kernels, and compilers.",
    skills: ["C", "C++20", "Rust", "Algorithms", "LLVM", "Linux Kernel", "Go"],
    enrolled_courses: ["course-cs301", "course-cs401"],
    assigned_faculty_ids: ["fac-smith", "fac-sharma"],
    attendance_history: [
      { course_id: "course-cs301", course_name: "Database Management Systems", total_classes: 32, attended_classes: 31, percentage: 97 },
      { course_id: "course-cs401", course_name: "Machine Learning & AI", total_classes: 28, attended_classes: 27, percentage: 96 },
    ],
    projects: [
      {
        id: "proj-4",
        title: "Mini-Rust Compiler for RISC-V",
        role: "Sole Developer",
        tech: "Rust, LLVM, RISC-V Assembly",
        description: "Implemented a subset compiler of the Rust programming language with register allocation and AST optimizations.",
        featured: true,
      }
    ],
    internships: [],
    clubs: [
      {
        id: "club-4",
        name: "KJSCE Competitive Programming Society",
        role: "President",
        duration: "2023 – Present",
        description: "Mentoring 120+ freshman students in data structures, graph theory, and dynamic programming.",
      }
    ],
    certifications: []
  },
  {
    student_id: "stu-104",
    student_id_number: "STU-2023-144",
    full_name: "Isha Kulkarni",
    name: "Isha Kulkarni",
    email: "isha.kulkarni@somaiya.edu",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    program: "Master of Computer Applications (MCA)",
    department: "Computer Applications",
    semester: 2,
    academic_year: "2024–2025",
    cgpa: 8.78,
    total_credits: 42,
    attendance_percentage: 91,
    bio: "Graduate student specializing in Enterprise Java microservices, Spring Boot, cloud databases, and data warehousing.",
    skills: ["Java", "Spring Boot", "Hibernate", "Oracle SQL", "Kafka", "Docker", "Angular"],
    enrolled_courses: ["course-mca102", "course-cs301"],
    assigned_faculty_ids: ["fac-nair", "fac-smith"],
    attendance_history: [
      { course_id: "course-mca102", course_name: "Advanced Java & Distributed Systems", total_classes: 30, attended_classes: 28, percentage: 93.3 },
      { course_id: "course-cs301", course_name: "Database Management Systems", total_classes: 32, attended_classes: 29, percentage: 90.6 },
    ],
    projects: [
      {
        id: "proj-5",
        title: "Enterprise Banking Event Streaming Hub",
        role: "Backend Architect",
        tech: "Spring Boot, Apache Kafka, Redis, PostgreSQL",
        description: "Distributed banking transaction pipeline with idempotency guarantees and dead-letter queue resilience.",
        featured: true,
      }
    ],
    internships: [],
    clubs: [],
    certifications: []
  },
  {
    student_id: "stu-105",
    student_id_number: "STU-2024-032",
    full_name: "Kabir Joshi",
    name: "Kabir Joshi",
    email: "kabir.joshi@somaiya.edu",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    program: "B.Tech Electronics & Telecommunication",
    department: "Electronics Engineering",
    semester: 2,
    academic_year: "2024–2025",
    cgpa: 8.52,
    total_credits: 38,
    attendance_percentage: 86,
    bio: "Embedded systems hardware enthusiast. Designing low-power sensor nodes, LoRaWAN campus gateways, and IoT hardware prototypes.",
    skills: ["Embedded C", "ARM Cortex", "KiCad PCB Design", "Verilog", "Python", "MQTT"],
    enrolled_courses: ["course-ec302", "course-it201"],
    assigned_faculty_ids: ["fac-joshi", "fac-iyer"],
    attendance_history: [
      { course_id: "course-ec302", course_name: "Microprocessors & Embedded Systems", total_classes: 26, attended_classes: 23, percentage: 88.5 },
      { course_id: "course-it201", course_name: "Data Structures & Algorithms", total_classes: 30, attended_classes: 25, percentage: 83.3 },
    ],
    projects: [],
    internships: [],
    clubs: [],
    certifications: []
  }
];

// -------------------------------------------------------------
// 2. 5 Full Faculty Members
// -------------------------------------------------------------
export const initialFaculty: FacultyMember[] = [
  {
    id: "fac-smith",
    faculty_id: "FAC-2015-042",
    name: "Dr. Jane Smith",
    full_name: "Dr. Jane Smith",
    email: "jane.smith@somaiya.edu",
    designation: "Professor & Head of Department",
    department: "Computer Engineering",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    office_location: "SSBAS (KJSCE) Room 308",
    office_hours: "Mon & Wed: 3:00 PM – 4:30 PM",
    qualifications: "Ph.D. in Computer Science (IIT Bombay), M.Tech (KJSCE)",
    specialization: ["Distributed Relational Databases", "Query Optimization", "Cloud Architectures"],
    teaching_courses: ["course-cs301"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: "Senior educator and researcher with 18+ years of academic leadership at Somaiya Vidyavihar. Published 40+ IEEE/ACM journal papers on database query compilers.",
    phone: "+91 22 6728 3080",
  },
  {
    id: "fac-iyer",
    faculty_id: "FAC-2017-018",
    name: "Prof. Ramesh Iyer",
    full_name: "Prof. Ramesh Iyer",
    email: "ramesh.iyer@somaiya.edu",
    designation: "Associate Professor",
    department: "Information Technology",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    office_location: "Bhaskaracharya Complex Room 402",
    office_hours: "Tue & Thu: 2:00 PM – 3:30 PM",
    qualifications: "M.Tech in IT (BITS Pilani), B.Tech (VJTI)",
    specialization: ["Data Structures & Algorithms", "Discrete Mathematics", "Graph Neural Networks"],
    teaching_courses: ["course-it201"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: "Renowned algorithms mentor who has trained over 1,500 Somaiya students for national ICPC finals and competitive coding championships.",
    phone: "+91 22 6728 4020",
  },
  {
    id: "fac-sharma",
    faculty_id: "FAC-2019-077",
    name: "Dr. Ananya Sharma",
    full_name: "Dr. Ananya Sharma",
    email: "ananya.sharma@somaiya.edu",
    designation: "Assistant Professor",
    department: "Computer Engineering",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
    office_location: "SSBAS (KJSCE) AI Lab 202",
    office_hours: "Monday & Friday: 11:30 AM – 1:00 PM",
    qualifications: "Ph.D. in Artificial Intelligence (IISc Bangalore)",
    specialization: ["Deep Learning", "Computer Vision", "Reinforcement Learning"],
    teaching_courses: ["course-cs401"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: "Leads the Somaiya Vision & Robotics lab. Recipient of the 2023 National Young Researcher Grant in Computer Vision.",
    phone: "+91 22 6728 2020",
  },
  {
    id: "fac-joshi",
    faculty_id: "FAC-2012-009",
    name: "Prof. Vikram Joshi",
    full_name: "Prof. Vikram Joshi",
    email: "vikram.joshi@somaiya.edu",
    designation: "Associate Professor",
    department: "Electronics Engineering",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    office_location: "Bhaskaracharya Room 210",
    office_hours: "Daily: 1:30 PM – 2:30 PM",
    qualifications: "M.Tech in Microelectronics (IIT Madras)",
    specialization: ["Microprocessors & Microcontrollers", "VLSI Design", "Industrial IoT"],
    teaching_courses: ["course-ec302"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: "Pioneer in FPGA and RISC-V hardware development at Somaiya. Advises hardware startups at RIIDL incubation center.",
    phone: "+91 22 6728 2100",
  },
  {
    id: "fac-nair",
    faculty_id: "FAC-2016-033",
    name: "Dr. Priya Nair",
    full_name: "Dr. Priya Nair",
    email: "priya.nair@somaiya.edu",
    designation: "Associate Professor",
    department: "Computer Applications",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80",
    office_location: "Aurobindo Building Room 108",
    office_hours: "Wednesday: 10:00 AM – 12:00 PM",
    qualifications: "Ph.D. in Information Systems (Mumbai University)",
    specialization: ["Enterprise Java", "Distributed Cloud Computing", "Microservices"],
    teaching_courses: ["course-mca102"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: "Head of Graduate MCA Curriculum. Industry consultant for enterprise banking migration to containerized microservices.",
    phone: "+91 22 6728 1080",
  }
];

// -------------------------------------------------------------
// 3. Courses Definition
// -------------------------------------------------------------
export const initialCourses: CourseData[] = [
  {
    id: "course-cs301",
    code: "CS301",
    name: "Database Management Systems & Architecture",
    department: "Computer Engineering",
    credits: 4,
    description: "Relational algebra, query optimization, B-Tree and LSM indexing, ACID transactions, and distributed storage engines.",
    faculty_id: "fac-smith",
    enrolled_student_ids: ["stu-101", "stu-102", "stu-103", "stu-104"],
    color: "#A51C30", // Somaiya Maroon
    semester: 4,
  },
  {
    id: "course-cs302",
    code: "CS302",
    name: "Computer Networks & Cloud Protocols",
    department: "Computer Engineering",
    credits: 4,
    description: "OSI and TCP/IP stack, socket programming, BGP routing, HTTP/3, and cloud infrastructure architectures.",
    faculty_id: "fac-sharma",
    enrolled_student_ids: ["stu-101", "stu-103", "stu-104"],
    color: "#7c3aed",
    semester: 4,
  },
  {
    id: "course-cs401",
    code: "CS401",
    name: "Machine Learning & Neural Architectures",
    department: "Computer Engineering",
    credits: 4,
    description: "Supervised & unsupervised models, deep backpropagation, CNNs, transformers, and model quantization.",
    faculty_id: "fac-sharma",
    enrolled_student_ids: ["stu-101", "stu-103"],
    color: "#9333ea",
    semester: 6,
  },
  {
    id: "course-cs402",
    code: "CS402",
    name: "Operating Systems & Kernel Internals",
    department: "Computer Engineering",
    credits: 4,
    description: "Process scheduling, virtual memory management, POSIX IPC, device drivers, and file system implementations.",
    faculty_id: "fac-smith",
    enrolled_student_ids: ["stu-101", "stu-102", "stu-104"],
    color: "#dc2626",
    semester: 5,
  },
  {
    id: "course-it201",
    code: "IT201",
    name: "Data Structures & Algorithmic Complexity",
    department: "Information Technology",
    credits: 4,
    description: "Balanced search trees, graphs, dynamic programming, algorithmic proofs, and cache-oblivious designs.",
    faculty_id: "fac-iyer",
    enrolled_student_ids: ["stu-101", "stu-102", "stu-105"],
    color: "#2563eb",
    semester: 4,
  },
  {
    id: "course-it301",
    code: "IT301",
    name: "Full-Stack Web Systems & Cloud Platforms",
    department: "Information Technology",
    credits: 4,
    description: "Next.js, reactive web architectures, asynchronous streaming, Docker containerization, and AWS serverless architectures.",
    faculty_id: "fac-iyer",
    enrolled_student_ids: ["stu-102", "stu-103", "stu-105"],
    color: "#0284c7",
    semester: 5,
  },
  {
    id: "course-it302",
    code: "IT302",
    name: "Cryptography & Cyber Defense",
    department: "Information Technology",
    credits: 3,
    description: "Symmetric and asymmetric ciphers, zero-knowledge proofs, TLS handshakes, and penetration testing methodologies.",
    faculty_id: "fac-iyer",
    enrolled_student_ids: ["stu-102", "stu-105"],
    color: "#0d9488",
    semester: 6,
  },
  {
    id: "course-ai301",
    code: "AI301",
    name: "Deep Learning & Computer Vision",
    department: "AI & Data Science",
    credits: 4,
    description: "Spatial convolutions, object detection pipelines, segmentation with U-Nets, and generative diffusion models.",
    faculty_id: "fac-sharma",
    enrolled_student_ids: ["stu-101", "stu-103"],
    color: "#6366f1",
    semester: 6,
  },
  {
    id: "course-ai302",
    code: "AI302",
    name: "Natural Language Processing & LLMs",
    department: "AI & Data Science",
    credits: 4,
    description: "Tokenization, self-attention mechanisms, retrieval-augmented generation (RAG), and parameter-efficient fine-tuning (LoRA).",
    faculty_id: "fac-sharma",
    enrolled_student_ids: ["stu-101", "stu-103"],
    color: "#8b5cf6",
    semester: 6,
  },
  {
    id: "course-ec301",
    code: "EC301",
    name: "Digital Signal Processing & Filter Design",
    department: "Electronics Engineering",
    credits: 4,
    description: "Discrete Fourier transform, FFT algorithms, IIR/FIR digital filters, and MATLAB hardware synthesis.",
    faculty_id: "fac-joshi",
    enrolled_student_ids: ["stu-102", "stu-105"],
    color: "#ea580c",
    semester: 5,
  },
  {
    id: "course-ec302",
    code: "EC302",
    name: "Microprocessors & Embedded Systems",
    department: "Electronics Engineering",
    credits: 4,
    description: "ARM Cortex architecture, bus protocols, real-time operating systems, GPIO, and embedded sensor integration.",
    faculty_id: "fac-joshi",
    enrolled_student_ids: ["stu-102", "stu-105"],
    color: "#d97706",
    semester: 2,
  },
  {
    id: "course-me201",
    code: "ME201",
    name: "Applied Engineering Mathematics & Linear Algebra",
    department: "Basic and Applied Sciences (SSBAS)",
    credits: 4,
    description: "Matrix decompositions (SVD, QR), multivariable calculus, differential equations, and numerical analysis.",
    faculty_id: "fac-iyer",
    enrolled_student_ids: ["stu-101", "stu-102", "stu-103", "stu-104", "stu-105"],
    color: "#475569",
    semester: 2,
  },
  {
    id: "course-mca101",
    code: "MCA101",
    name: "Object-Oriented Software Engineering & Design Patterns",
    department: "Computer Applications",
    credits: 4,
    description: "SOLID principles, GoF design patterns, UML structural modeling, and automated test-driven development.",
    faculty_id: "fac-nair",
    enrolled_student_ids: ["stu-104"],
    color: "#059669",
    semester: 1,
  },
  {
    id: "course-mca102",
    code: "MCA102",
    name: "Advanced Java & Distributed Systems",
    department: "Computer Applications",
    credits: 4,
    description: "Spring Boot, asynchronous messaging with Kafka, multi-threading, RESTful design, and container deployment.",
    faculty_id: "fac-nair",
    enrolled_student_ids: ["stu-104"],
    color: "#10b981",
    semester: 2,
  },
  {
    id: "course-ds201",
    code: "DS201",
    name: "Applied Probability, Statistics & Exploratory Analytics",
    department: "Basic and Applied Sciences (SSBAS)",
    credits: 3,
    description: "Bayesian inference, hypothesis testing, stochastic processes, and statistical programming with Python Pandas.",
    faculty_id: "fac-sharma",
    enrolled_student_ids: ["stu-101", "stu-103"],
    color: "#3b82f6",
    semester: 3,
  },
  {
    id: "course-bt301",
    code: "BT301",
    name: "Computational Biology & Bioinformatics Foundations",
    department: "Basic and Applied Sciences (SSBAS)",
    credits: 3,
    description: "Sequence alignment algorithms, protein structure modeling, molecular dynamics simulations, and phylogenetic trees.",
    faculty_id: "fac-smith",
    enrolled_student_ids: ["stu-101", "stu-102"],
    color: "#14b8a6",
    semester: 5,
  }
];

// -------------------------------------------------------------
// 4. Master Monday–Friday Timetable Schedule
// -------------------------------------------------------------
export const initialTimetableSlots: TimetableSlot[] = [
  // MONDAY
  {
    id: "slot-mon-1",
    course_id: "course-cs301",
    course_name: "Database Management Systems",
    course_code: "CS301",
    faculty_id: "fac-smith",
    faculty_name: "Dr. Jane Smith",
    room_id: "room-ssbas-301",
    room_number: "SSBAS 301",
    building: "KJSCE (SSBAS)",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "10:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#A51C30",
  },
  {
    id: "slot-mon-2",
    course_id: "course-it201",
    course_name: "Data Structures & Algorithms",
    course_code: "IT201",
    faculty_id: "fac-iyer",
    faculty_name: "Prof. Ramesh Iyer",
    room_id: "room-bhak-201",
    room_number: "Bhaskaracharya 201",
    building: "Bhaskaracharya",
    day_of_week: "Monday",
    start_time: "11:00",
    end_time: "12:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#2563eb",
  },
  {
    id: "slot-mon-3",
    course_id: "course-cs401",
    course_name: "Machine Learning & AI",
    course_code: "CS401",
    faculty_id: "fac-sharma",
    faculty_name: "Dr. Ananya Sharma",
    room_id: "room-ssbas-lab2",
    room_number: "AI Lab 202",
    building: "KJSCE (SSBAS)",
    day_of_week: "Monday",
    start_time: "14:00",
    end_time: "16:00",
    type: "lab",
    is_locked: true,
    is_cancelled: false,
    color: "#7c3aed",
  },

  // TUESDAY
  {
    id: "slot-tue-1",
    course_id: "course-ec302",
    course_name: "Microprocessors & Embedded Systems",
    course_code: "EC302",
    faculty_id: "fac-joshi",
    faculty_name: "Prof. Vikram Joshi",
    room_id: "room-bhak-lab1",
    room_number: "Embedded Lab 104",
    building: "Bhaskaracharya",
    day_of_week: "Tuesday",
    start_time: "09:30",
    end_time: "11:00",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#d97706",
  },
  {
    id: "slot-tue-2",
    course_id: "course-cs301",
    course_name: "Database Management Systems (Lab)",
    course_code: "CS301",
    faculty_id: "fac-smith",
    faculty_name: "Dr. Jane Smith",
    room_id: "room-ssbas-lab1",
    room_number: "Database Lab 204",
    building: "KJSCE (SSBAS)",
    day_of_week: "Tuesday",
    start_time: "11:30",
    end_time: "13:30",
    type: "lab",
    is_locked: true,
    is_cancelled: false,
    color: "#A51C30",
  },
  {
    id: "slot-tue-3",
    course_id: "course-mca102",
    course_name: "Advanced Java & Distributed Systems",
    course_code: "MCA102",
    faculty_id: "fac-nair",
    faculty_name: "Dr. Priya Nair",
    room_id: "room-auro-201",
    room_number: "Aurobindo 201",
    building: "Aurobindo",
    day_of_week: "Tuesday",
    start_time: "14:30",
    end_time: "16:00",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#059669",
  },

  // WEDNESDAY
  {
    id: "slot-wed-1",
    course_id: "course-it201",
    course_name: "Data Structures & Algorithms",
    course_code: "IT201",
    faculty_id: "fac-iyer",
    faculty_name: "Prof. Ramesh Iyer",
    room_id: "room-bhak-201",
    room_number: "Bhaskaracharya 201",
    building: "Bhaskaracharya",
    day_of_week: "Wednesday",
    start_time: "09:00",
    end_time: "10:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#2563eb",
  },
  {
    id: "slot-wed-2",
    course_id: "course-cs401",
    course_name: "Machine Learning & AI",
    course_code: "CS401",
    faculty_id: "fac-sharma",
    faculty_name: "Dr. Ananya Sharma",
    room_id: "room-ssbas-301",
    room_number: "SSBAS 301",
    building: "KJSCE (SSBAS)",
    day_of_week: "Wednesday",
    start_time: "11:00",
    end_time: "12:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#7c3aed",
  },
  {
    id: "slot-wed-3",
    course_id: "course-cs301",
    course_name: "Database Management Systems",
    course_code: "CS301",
    faculty_id: "fac-smith",
    faculty_name: "Dr. Jane Smith",
    room_id: "room-ssbas-301",
    room_number: "SSBAS 301",
    building: "KJSCE (SSBAS)",
    day_of_week: "Wednesday",
    start_time: "14:00",
    end_time: "15:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#A51C30",
  },

  // THURSDAY
  {
    id: "slot-thu-1",
    course_id: "course-mca102",
    course_name: "Advanced Java & Distributed Systems (Lab)",
    course_code: "MCA102",
    faculty_id: "fac-nair",
    faculty_name: "Dr. Priya Nair",
    room_id: "room-auro-lab1",
    room_number: "Software Lab 102",
    building: "Aurobindo",
    day_of_week: "Thursday",
    start_time: "10:00",
    end_time: "12:00",
    type: "lab",
    is_locked: true,
    is_cancelled: false,
    color: "#059669",
  },
  {
    id: "slot-thu-2",
    course_id: "course-ec302",
    course_name: "Microprocessors & Embedded Systems",
    course_code: "EC302",
    faculty_id: "fac-joshi",
    faculty_name: "Prof. Vikram Joshi",
    room_id: "room-bhak-201",
    room_number: "Bhaskaracharya 201",
    building: "Bhaskaracharya",
    day_of_week: "Thursday",
    start_time: "13:00",
    end_time: "14:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#d97706",
  },

  // FRIDAY
  {
    id: "slot-fri-1",
    course_id: "course-cs301",
    course_name: "Database Management Systems",
    course_code: "CS301",
    faculty_id: "fac-smith",
    faculty_name: "Dr. Jane Smith",
    room_id: "room-ssbas-301",
    room_number: "SSBAS 301",
    building: "KJSCE (SSBAS)",
    day_of_week: "Friday",
    start_time: "10:00",
    end_time: "11:30",
    type: "lecture",
    is_locked: true,
    is_cancelled: false,
    color: "#A51C30",
  },
  {
    id: "slot-fri-2",
    course_id: "course-it201",
    course_name: "Data Structures & Algorithms (Lab)",
    course_code: "IT201",
    faculty_id: "fac-iyer",
    faculty_name: "Prof. Ramesh Iyer",
    room_id: "room-bhak-lab2",
    room_number: "Computing Lab 304",
    building: "Bhaskaracharya",
    day_of_week: "Friday",
    start_time: "14:00",
    end_time: "16:00",
    type: "lab",
    is_locked: true,
    is_cancelled: false,
    color: "#2563eb",
  }
];

export const masterTimetableSlots = initialTimetableSlots;

// -------------------------------------------------------------
// 5. Campus Rooms Catalog (Cross-referenced with Map & Timetable)
// -------------------------------------------------------------
export const initialRooms: CampusRoom[] = [
  {
    id: "room-ssbas-301",
    building_id: "ssbas",
    building_name: "KJSCE (SSBAS)",
    room_number: "SSBAS 301",
    name: "CS Smart Lecture Hall 1",
    floor: 3,
    capacity: 65,
    type: "classroom",
    facilities: ["4K Projector", "Smart Podium", "Air Conditioned", "Lecture Recording"],
  },
  {
    id: "room-ssbas-302",
    building_id: "ssbas",
    building_name: "KJSCE (SSBAS)",
    room_number: "SSBAS 302",
    name: "Engineering Seminar Room 2",
    floor: 3,
    capacity: 50,
    type: "classroom",
    facilities: ["Dual Displays", "Whiteboard", "Air Conditioned"],
  },
  {
    id: "room-ssbas-lab1",
    building_id: "ssbas",
    building_name: "KJSCE (SSBAS)",
    room_number: "Database Lab 204",
    name: "Advanced Database & Cloud Lab",
    floor: 2,
    capacity: 40,
    type: "laboratory",
    facilities: ["40 Workstations (i7, 32GB RAM)", "Gigabit LAN", "Server Access"],
  },
  {
    id: "room-ssbas-lab2",
    building_id: "ssbas",
    building_name: "KJSCE (SSBAS)",
    room_number: "AI Lab 202",
    name: "GPU Deep Learning Lab",
    floor: 2,
    capacity: 35,
    type: "laboratory",
    facilities: ["NVIDIA RTX A5000 Workstations", "Jupyter Hub Server", "Air Conditioned"],
  },
  {
    id: "room-bhak-201",
    building_id: "bhaskaracharya",
    building_name: "Bhaskaracharya Complex",
    room_number: "Bhaskaracharya 201",
    name: "IT Core Lecture Room",
    floor: 2,
    capacity: 70,
    type: "classroom",
    facilities: ["Projector", "Sound System", "Wi-Fi 6"],
  },
  {
    id: "room-bhak-lab1",
    building_id: "bhaskaracharya",
    building_name: "Bhaskaracharya Complex",
    room_number: "Embedded Lab 104",
    name: "Microprocessors & IoT Workshop",
    floor: 1,
    capacity: 30,
    type: "laboratory",
    facilities: ["Oscilloscopes", "Soldering Stations", "ARM Development Boards"],
  },
  {
    id: "room-bhak-lab2",
    building_id: "bhaskaracharya",
    building_name: "Bhaskaracharya Complex",
    room_number: "Computing Lab 304",
    name: "Algorithms & Competitive Coding Arena",
    floor: 3,
    capacity: 45,
    type: "laboratory",
    facilities: ["Linux Desktops", "Dual Monitor Setups"],
  },
  {
    id: "room-auro-201",
    building_id: "aurobindo",
    building_name: "Sri Aurobindo Building",
    room_number: "Aurobindo 201",
    name: "MCA Tiered Lecture Hall",
    floor: 2,
    capacity: 80,
    type: "classroom",
    facilities: ["Tiered Seating", "Dolby Sound", "Dual Laser Projectors"],
  },
  {
    id: "room-auro-lab1",
    building_id: "aurobindo",
    building_name: "Sri Aurobindo Building",
    room_number: "Software Lab 102",
    name: "Enterprise Java Architecture Lab",
    floor: 1,
    capacity: 40,
    type: "laboratory",
    facilities: ["Enterprise Microservices Server", "Cloud IDEs"],
  },
  {
    id: "lib-101",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-101",
    name: "Quiet Focus Pod Alpha",
    floor: 1,
    capacity: 2,
    type: "study_pod",
    facilities: ["Acoustic Soundproofing", "Dual USB-C 65W Fast Charging", "Ergonomic Chairs", "Dimmable Task Light"],
  },
  {
    id: "lib-102",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-102",
    name: "Quiet Focus Pod Beta",
    floor: 1,
    capacity: 2,
    type: "study_pod",
    facilities: ["Acoustic Soundproofing", "Power Outlets", "Desk Whiteboard", "Task Lamp"],
  },
  {
    id: "lib-201",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-201",
    name: "Collaborative Research Suite 1",
    floor: 2,
    capacity: 6,
    type: "study_pod",
    facilities: ["55\" 4K Screen (AirPlay/HDMI)", "Magnetic Glass Whiteboard", "Conference Mic", "Gigabit LAN"],
  },
  {
    id: "lib-202",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-202",
    name: "Collaborative Research Suite 2",
    floor: 2,
    capacity: 8,
    type: "study_pod",
    facilities: ["65\" Interactive Touch Display", "Dual Full-Wall Whiteboards", "Air Conditioning", "Video Soundbar"],
  },
  {
    id: "lib-203",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-203",
    name: "Faculty & Scholar Reading Room",
    floor: 2,
    capacity: 4,
    type: "study_pod",
    facilities: ["Direct Stack Reference Access", "Dual Power Sockets", "Natural Daylighting", "Reading Loungers"],
  },
  {
    id: "lib-301",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-301",
    name: "Digital Heritage & Archive Station",
    floor: 3,
    capacity: 4,
    type: "study_pod",
    facilities: ["Overhead High-Res Book Scanner", "Microfilm Reader Workstation", "Archival Gloves Provided", "Dual 27\" Displays"],
  },
  {
    id: "lib-302",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-302",
    name: "Deep Silent Solo Cubicle A",
    floor: 3,
    capacity: 1,
    type: "study_pod",
    facilities: ["Strict Zero-Noise Policy", "Ergonomic Armchair", "Warm Lumbar Lamp", "Individual Climate Vent"],
  },
  {
    id: "lib-303",
    building_id: "library",
    building_name: "Somaiya Central Library",
    room_number: "LIB-303",
    name: "Deep Silent Solo Cubicle B",
    floor: 3,
    capacity: 1,
    type: "study_pod",
    facilities: ["Strict Zero-Noise Policy", "Warm Lumbar Lamp", "Power Outlet", "Individual Vent"],
  }
];

// -------------------------------------------------------------
// 6. Classroom Study Materials (Notes, Slides, PDFs)
// -------------------------------------------------------------
export const initialMaterials: ClassroomMaterial[] = [
  {
    id: "mat-1",
    course_id: "course-cs301",
    course_code: "CS301",
    title: "Unit 3: B+ Trees, Hashing & Disk Block Indexing",
    description: "Detailed theoretical guide and mathematical proofs for B+ Tree balancing, node splits, and buffer pool paging.",
    unit: "Unit 3",
    file_type: "pdf",
    file_size: "3.4 MB",
    file_url: "#",
    upload_date: "2026-09-08",
    uploaded_by_faculty_id: "fac-smith",
    uploaded_by_name: "Dr. Jane Smith",
    preview_text: "Indexing mechanisms in relational engines reduce page I/O by constructing balanced multi-way tree structures..."
  },
  {
    id: "mat-2",
    course_id: "course-cs301",
    course_code: "CS301",
    title: "Unit 4: ACID Properties, 2PL & Concurrency Control",
    description: "Lecture slides covering strict two-phase locking, phantom reads, multi-version concurrency control (MVCC), and WAL recovery.",
    unit: "Unit 4",
    file_type: "slides",
    file_size: "5.1 MB",
    file_url: "#",
    upload_date: "2026-09-05",
    uploaded_by_faculty_id: "fac-smith",
    uploaded_by_name: "Dr. Jane Smith",
    preview_text: "Transactions ensure data integrity under concurrent user access. ACID guarantees: Atomicity, Consistency, Isolation, Durability."
  },
  {
    id: "mat-3",
    course_id: "course-it201",
    course_code: "IT201",
    title: "Dynamic Programming: Knapsack & Longest Common Subsequence",
    description: "Handwritten revision notes with bottom-up state transition tables, memoization code in C++, and time-space trade-offs.",
    unit: "Unit 4",
    file_type: "notes",
    file_size: "2.8 MB",
    file_url: "#",
    upload_date: "2026-09-07",
    uploaded_by_faculty_id: "fac-iyer",
    uploaded_by_name: "Prof. Ramesh Iyer",
    preview_text: "DP optimizes recursion by saving intermediate overlapping subproblem solutions in memoized arrays or lookup tables."
  },
  {
    id: "mat-4",
    course_id: "course-cs401",
    course_code: "CS401",
    title: "Convolutional Neural Networks & ResNet Architecture Tutorial",
    description: "Lab guide containing PyTorch implementation for CIFAR-10 training, residual skip connections, and batch normalization.",
    unit: "Unit 2",
    file_type: "code",
    file_size: "1.2 MB",
    file_url: "#",
    upload_date: "2026-09-06",
    uploaded_by_faculty_id: "fac-sharma",
    uploaded_by_name: "Dr. Ananya Sharma",
    preview_text: "Convolution layers extract local spatial features using trainable 2D kernels, followed by ReLU activations and MaxPool downsampling."
  }
];

// -------------------------------------------------------------
// 7. Campus Events (Distinct from Timetable, Admin CRUD)
// -------------------------------------------------------------
export const initialEvents: UniversityEvent[] = [
  {
    id: "evt-1",
    title: "Somaiya Hackathon 2026: AI for Smart Cities",
    description: "36-hour national hackathon bringing together 500+ student developers to build AI solutions for urban mobility, water conservation, and sustainability.",
    category: "hackathon",
    location: "Gargi Plaza & SSBAS High-Tech Labs",
    start_time: "09:00 AM",
    end_time: "09:00 PM (Next Day)",
    date: "2026-09-18",
    banner_color: "from-red-600/30 to-amber-600/30",
    capacity: 500,
    registrations: 384,
    is_registered: true,
    status: "upcoming"
  },
  {
    id: "evt-2",
    title: "Symphony 2026: Annual University Cultural Fest",
    description: "The grand cultural extravaganza of Somaiya Vidyavihar featuring battle of the bands, classical dances, theatrical dramas, and celebrity performances.",
    category: "cultural",
    location: "Gargi Amphitheatre & Central Lawns",
    start_time: "05:00 PM",
    end_time: "10:30 PM",
    date: "2026-09-25",
    banner_color: "from-purple-600/30 to-pink-600/30",
    capacity: 2500,
    registrations: 1840,
    is_registered: false,
    status: "upcoming"
  },
  {
    id: "evt-3",
    title: "Industry Keynote: Next-Gen Semiconductor Fabrication",
    description: "Distinguished guest lecture by IEEE Fellow on 2nm GAAFET silicon architectures and indigenous semiconductor manufacturing in India.",
    category: "academic",
    location: "Aurobindo Auditorium 101",
    start_time: "03:00 PM",
    end_time: "04:30 PM",
    date: "2026-09-12",
    banner_color: "from-blue-600/30 to-cyan-600/30",
    capacity: 200,
    registrations: 189,
    is_registered: true,
    status: "upcoming"
  },
  {
    id: "evt-4",
    title: "Somaiya Inter-Collegiate Football Championship",
    description: "Annual university football tournament held under the floodlights at the Somaiya Sports Academy Olympic turf.",
    category: "sports",
    location: "Somaiya Sports Academy & Running Turf",
    start_time: "04:00 PM",
    end_time: "08:00 PM",
    date: "2026-09-15",
    banner_color: "from-emerald-600/30 to-teal-600/30",
    capacity: 1200,
    registrations: 620,
    is_registered: false,
    status: "upcoming"
  }
];

// -------------------------------------------------------------
// 8. Central Notifications System
// -------------------------------------------------------------
export interface CentralNotification {
  id: string;
  title: string;
  message: string;
  type: "cancellation" | "event" | "material" | "schedule" | "system";
  timestamp: string;
  read: boolean;
  link?: string;
  slot_id?: string;
  room_number?: string;
  course_code?: string;
  severity?: "info" | "warning" | "success" | "danger";
}

export const initialNotifications: CentralNotification[] = [
  {
    id: "notif-1",
    title: "Classroom Study Material Uploaded",
    message: "Dr. Jane Smith uploaded 'Unit 3: B+ Trees, Hashing & Disk Block Indexing' for CS301 Database Management Systems.",
    type: "material",
    timestamp: "2026-09-08T14:30:00.000Z",
    read: false,
    link: "/student/classroom",
    course_code: "CS301",
    severity: "info",
  },
  {
    id: "notif-2",
    title: "Somaiya Hackathon 2026 Registration Confirmed",
    message: "Your team registration for the 36-hour 'AI for Smart Cities' hackathon has been verified by the organizing committee.",
    type: "event",
    timestamp: "2026-09-07T11:15:00.000Z",
    read: false,
    link: "/student/events",
    severity: "success",
  },
  {
    id: "notif-3",
    title: "Timetable Advisory: High Lab Utilization",
    message: "SSBAS 301 and Computing Lab 304 have scheduled system maintenance on Friday between 17:00 and 19:00.",
    type: "schedule",
    timestamp: "2026-09-06T09:00:00.000Z",
    read: true,
    link: "/student/my-day",
    severity: "warning",
  }
];

// -------------------------------------------------------------
// 9. Relational Reactive Data Helpers & LocalStorage Sync
// -------------------------------------------------------------
const isBrowser = typeof window !== "undefined";

function safeGetStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage<T>(key: string, data: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage for ${key}`, e);
  }
}

// Students
export function getStoredStudents(): StudentProfile[] {
  return safeGetStorage<StudentProfile[]>("nexus_students", initialStudents);
}

export function saveStoredStudents(students: StudentProfile[]): void {
  safeSetStorage("nexus_students", students);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-students-updated", { detail: students }));
}

export function getStudentById(id: string): StudentProfile | undefined {
  const list = getStoredStudents();
  const cleanId = id.toLowerCase();
  return list.find(s => 
    s.student_id.toLowerCase() === cleanId || 
    s.student_id_number.toLowerCase() === cleanId || 
    s.email.toLowerCase() === cleanId ||
    s.full_name.toLowerCase().includes(cleanId)
  ) || list[0];
}

export function updateStudentPortfolio(id: string, updates: Partial<StudentProfile>): StudentProfile {
  const list = getStoredStudents();
  const index = list.findIndex(s => s.student_id === id || s.email === id);
  if (index === -1) {
    // update the first if fallback
    list[0] = { ...list[0], ...updates };
    saveStoredStudents(list);
    return list[0];
  }
  list[index] = { ...list[index], ...updates };
  saveStoredStudents(list);
  return list[index];
}

// Faculty
export function getStoredFaculty(): FacultyMember[] {
  return safeGetStorage<FacultyMember[]>("nexus_faculty", initialFaculty);
}

export function saveStoredFaculty(faculty: FacultyMember[]): void {
  safeSetStorage("nexus_faculty", faculty);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-faculty-updated", { detail: faculty }));
}

export function getFacultyById(id: string): FacultyMember | undefined {
  const list = getStoredFaculty();
  const cleanId = id.toLowerCase();
  return list.find(f => 
    f.id.toLowerCase() === cleanId || 
    f.faculty_id.toLowerCase() === cleanId || 
    f.email.toLowerCase() === cleanId ||
    f.name.toLowerCase().includes(cleanId)
  ) || list[0];
}

export function updateFacultyStatus(id: string, status: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE"): FacultyMember {
  const list = getStoredFaculty();
  const index = list.findIndex(f => f.id === id || f.faculty_id === id);
  if (index !== -1) {
    list[index].manual_status = status;
    list[index].is_available = status === "AVAILABLE" || status === "OFFICE HOURS";
    saveStoredFaculty(list);
    return list[index];
  }
  return list[0];
}

// Timetable
export function getStoredTimetable(): TimetableSlot[] {
  return safeGetStorage<TimetableSlot[]>("nexus_timetable", masterTimetableSlots);
}

export function saveStoredTimetable(slots: TimetableSlot[]): void {
  safeSetStorage("nexus_timetable", slots);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-timetable-updated", { detail: slots }));
}

export function cancelLectureSlot(slotId: string, reason: string): TimetableSlot | null {
  const slots = getStoredTimetable();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return null;

  slot.is_cancelled = true;
  slot.is_locked = false; // unlock slot so students can schedule personal tasks
  slot.cancellation_reason = reason || "Faculty emergency / conference travel";
  slot.cancellation_date = new Date().toISOString();

  saveStoredTimetable(slots);

  // Trigger Central Notification
  addCentralNotification({
    title: `Lecture Cancelled: ${slot.course_code}`,
    message: `${slot.faculty_name} has cancelled ${slot.course_name} on ${slot.day_of_week} (${slot.start_time}–${slot.end_time}) in ${slot.room_number}. Reason: ${slot.cancellation_reason}. This slot is now unlocked for your personal study tasks, and room ${slot.room_number} is now marked as Vacant on campus.`,
    type: "cancellation",
    link: "/student/my-day",
    slot_id: slot.id,
    room_number: slot.room_number,
    course_code: slot.course_code,
    severity: "warning",
  });

  return slot;
}

export function restoreLectureSlot(slotId: string): TimetableSlot | null {
  const slots = getStoredTimetable();
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return null;

  slot.is_cancelled = false;
  slot.is_locked = true;
  delete slot.cancellation_reason;
  delete slot.cancellation_date;

  saveStoredTimetable(slots);

  addCentralNotification({
    title: `Lecture Restored: ${slot.course_code}`,
    message: `${slot.course_name} with ${slot.faculty_name} on ${slot.day_of_week} (${slot.start_time}–${slot.end_time}) has been restored to the official schedule.`,
    type: "schedule",
    link: "/student/my-day",
    slot_id: slot.id,
    room_number: slot.room_number,
    course_code: slot.course_code,
    severity: "info",
  });

  return slot;
}

export function addPersonalSlot(slotData: {
  title: string;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  start_time: string;
  end_time: string;
  user_id?: string;
  color?: string;
}): TimetableSlot {
  const slots = getStoredTimetable();
  const newSlot: TimetableSlot = {
    id: `personal-${Date.now()}`,
    course_id: "personal",
    course_name: slotData.title,
    course_code: "TASK",
    faculty_id: "self",
    faculty_name: "Self / Study Group",
    room_id: "free-study",
    room_number: "Library / Open Quad",
    building: "Somaiya Campus",
    day_of_week: slotData.day_of_week,
    start_time: slotData.start_time,
    end_time: slotData.end_time,
    type: "personal",
    is_locked: false,
    is_cancelled: false,
    color: slotData.color || "#059669",
    user_id: slotData.user_id || "stu-101",
  };

  slots.push(newSlot);
  saveStoredTimetable(slots);
  return newSlot;
}

export function deleteSlot(slotId: string): boolean {
  const slots = getStoredTimetable();
  const idx = slots.findIndex(s => s.id === slotId);
  if (idx === -1) return false;
  // If it is an official slot, mark cancelled instead of deleting
  if (slots[idx].is_locked) {
    cancelLectureSlot(slotId, "Removed from schedule");
    return true;
  }
  slots.splice(idx, 1);
  saveStoredTimetable(slots);
  return true;
}

export function getStoredRooms(): CampusRoom[] {
  const rooms = safeGetStorage<CampusRoom[]>("nexus_rooms", initialRooms);
  const hasAll = initialRooms.every(ir => rooms.some(r => r.room_number === ir.room_number || r.id === ir.id));
  if (!hasAll) {
    const merged = [...initialRooms];
    rooms.forEach(r => {
      if (!merged.some(m => m.room_number === r.room_number || m.id === r.id)) {
        merged.push(r);
      }
    });
    safeSetStorage("nexus_rooms", merged);
    return merged;
  }
  return rooms;
}

export interface RoomVacancyInfo {
  room: CampusRoom;
  is_vacant: boolean;
  status: "VACANT" | "OCCUPIED" | "FREED_BY_CANCELLATION";
  status_label: string;
  current_slot?: TimetableSlot;
  next_class_time?: string;
  cancellation_notice?: string;
}

export function getVacantRoomsStatus(targetDay: string = "Monday", targetTime: string = "10:30"): RoomVacancyInfo[] {
  const rooms = getStoredRooms();
  const timetable = getStoredTimetable();

  // Helper to compare "HH:MM"
  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const targetMin = timeToMin(targetTime);

  return rooms.map(room => {
    // Find slot occurring in this room on targetDay covering targetTime
    const matchingSlot = timetable.find(slot => {
      if (slot.room_id !== room.id && slot.room_number !== room.room_number) return false;
      if (slot.day_of_week.toLowerCase() !== targetDay.toLowerCase()) return false;
      const sMin = timeToMin(slot.start_time);
      const eMin = timeToMin(slot.end_time);
      return targetMin >= sMin && targetMin < eMin;
    });

    if (!matchingSlot) {
      // Find upcoming slot today after targetTime
      const nextSlot = timetable
        .filter(s => (s.room_id === room.id || s.room_number === room.room_number) && s.day_of_week.toLowerCase() === targetDay.toLowerCase() && !s.is_cancelled && timeToMin(s.start_time) > targetMin)
        .sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time))[0];

      return {
        room,
        is_vacant: true,
        status: "VACANT",
        status_label: nextSlot ? `Available until ${nextSlot.start_time}` : "Available all day",
        next_class_time: nextSlot ? nextSlot.start_time : undefined,
      };
    }

    if (matchingSlot.is_cancelled) {
      return {
        room,
        is_vacant: true,
        status: "FREED_BY_CANCELLATION",
        status_label: `Vacant (Class Cancelled: ${matchingSlot.course_code})`,
        current_slot: matchingSlot,
        cancellation_notice: matchingSlot.cancellation_reason || "Lecture cancelled by faculty",
      };
    }

    return {
      room,
      is_vacant: false,
      status: "OCCUPIED",
      status_label: `In Class: ${matchingSlot.course_code} (${matchingSlot.faculty_name})`,
      current_slot: matchingSlot,
    };
  });
}

// Classroom Materials
export function getStoredMaterials(courseId?: string): ClassroomMaterial[] {
  const all = safeGetStorage<ClassroomMaterial[]>("nexus_materials", initialMaterials);
  if (courseId) {
    return all.filter(m => m.course_id === courseId || m.course_code.toLowerCase() === courseId.toLowerCase());
  }
  return all;
}

export function saveStoredMaterials(materials: ClassroomMaterial[]): void {
  safeSetStorage("nexus_materials", materials);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-materials-updated", { detail: materials }));
}

export function addClassroomMaterial(mat: Omit<ClassroomMaterial, "id" | "upload_date">): ClassroomMaterial {
  const materials = getStoredMaterials();
  const newMat: ClassroomMaterial = {
    ...mat,
    id: `mat-${Date.now()}`,
    upload_date: new Date().toISOString().split("T")[0],
  };
  materials.unshift(newMat);
  saveStoredMaterials(materials);

  addCentralNotification({
    title: `New Study Material: ${newMat.course_code}`,
    message: `${newMat.uploaded_by_name} uploaded '${newMat.title}' (${newMat.file_type.toUpperCase()}, ${newMat.file_size}).`,
    type: "material",
    link: "/student/classroom",
    course_code: newMat.course_code,
    severity: "info",
  });

  return newMat;
}

export function deleteClassroomMaterial(id: string): boolean {
  const materials = getStoredMaterials();
  const idx = materials.findIndex(m => m.id === id);
  if (idx === -1) return false;
  materials.splice(idx, 1);
  saveStoredMaterials(materials);
  return true;
}

// Events
export function getStoredEvents(): UniversityEvent[] {
  return safeGetStorage<UniversityEvent[]>("nexus_events", initialEvents);
}

export function saveStoredEvents(events: UniversityEvent[]): void {
  safeSetStorage("nexus_events", events);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-events-updated", { detail: events }));
}

export function toggleEventRegistration(eventId: string): UniversityEvent | null {
  const events = getStoredEvents();
  const ev = events.find(e => e.id === eventId);
  if (!ev) return null;

  ev.is_registered = !ev.is_registered;
  if (ev.is_registered) {
    ev.registrations += 1;
    addCentralNotification({
      title: `Event Registration Confirmed`,
      message: `You are now registered for '${ev.title}'. Date: ${ev.date} at ${ev.location}.`,
      type: "event",
      link: "/student/events",
      severity: "success",
    });
  } else {
    ev.registrations = Math.max(0, ev.registrations - 1);
  }

  saveStoredEvents(events);
  return ev;
}

export function createEvent(eventData: Omit<UniversityEvent, "id">): UniversityEvent {
  const events = getStoredEvents();
  const newEv: UniversityEvent = {
    ...eventData,
    id: `evt-${Date.now()}`,
    registrations: 0,
    is_registered: false,
  };
  events.unshift(newEv);
  saveStoredEvents(events);

  addCentralNotification({
    title: `New University Event: ${newEv.title}`,
    message: `${newEv.title} scheduled for ${newEv.date} at ${newEv.location}. Registrations are now open.`,
    type: "event",
    link: "/student/events",
    severity: "info",
  });

  return newEv;
}

export function updateEvent(id: string, updates: Partial<UniversityEvent>): UniversityEvent | null {
  const events = getStoredEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates };
  saveStoredEvents(events);
  return events[idx];
}

export function deleteEvent(id: string): boolean {
  const events = getStoredEvents();
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) return false;
  events.splice(idx, 1);
  saveStoredEvents(events);
  return true;
}

// Central Notifications
export function getStoredNotifications(): CentralNotification[] {
  return safeGetStorage<CentralNotification[]>("nexus_notifications", initialNotifications);
}

export function saveStoredNotifications(notifications: CentralNotification[]): void {
  safeSetStorage("nexus_notifications", notifications);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-notifications-updated", { detail: notifications }));
}

export function addCentralNotification(notifData: Omit<CentralNotification, "id" | "timestamp" | "read">): CentralNotification {
  const list = getStoredNotifications();
  const newNotif: CentralNotification = {
    ...notifData,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  list.unshift(newNotif);
  saveStoredNotifications(list);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const list = getStoredNotifications();
  const notif = list.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveStoredNotifications(list);
  }
}

export function markAllNotificationsAsRead(): void {
  const list = getStoredNotifications();
  list.forEach(n => { n.read = true; });
  saveStoredNotifications(list);
}

export function clearNotification(id: string): void {
  const list = getStoredNotifications();
  const filtered = list.filter(n => n.id !== id);
  saveStoredNotifications(filtered);
}

// -------------------------------------------------------------
// Courses Management
// -------------------------------------------------------------
export function getStoredCourses(): CourseData[] {
  return safeGetStorage<CourseData[]>("nexus_courses", initialCourses);
}

export function saveStoredCourses(courses: CourseData[]): void {
  safeSetStorage("nexus_courses", courses);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-courses-updated", { detail: courses }));
}

export function addCourse(courseData: Omit<CourseData, "id"> & { id?: string }): CourseData {
  const courses = getStoredCourses();
  const newCourse: CourseData = {
    ...courseData,
    id: courseData.id || `course-${courseData.code.toLowerCase()}-${Date.now()}`,
    enrolled_student_ids: courseData.enrolled_student_ids || [],
    color: courseData.color || "#A51C30",
  };
  courses.push(newCourse);
  saveStoredCourses(courses);
  return newCourse;
}

export function updateCourse(id: string, updates: Partial<CourseData>): CourseData | null {
  const courses = getStoredCourses();
  const idx = courses.findIndex(c => c.id === id || c.code === id);
  if (idx === -1) return null;
  courses[idx] = { ...courses[idx], ...updates };
  saveStoredCourses(courses);
  return courses[idx];
}

export function deleteCourse(id: string): boolean {
  const courses = getStoredCourses();
  const idx = courses.findIndex(c => c.id === id || c.code === id);
  if (idx === -1) return false;
  courses.splice(idx, 1);
  saveStoredCourses(courses);
  return true;
}

// -------------------------------------------------------------
// Student CRUD
// -------------------------------------------------------------
export function addStudent(studentData: Partial<StudentProfile>): StudentProfile {
  const students = getStoredStudents();
  const id = studentData.student_id || `stu-${Date.now()}`;
  const newStudent: StudentProfile = {
    student_id: id,
    student_id_number: studentData.student_id_number || `STU-${Date.now()}`,
    full_name: studentData.full_name || studentData.name || "New Student",
    name: studentData.name || studentData.full_name || "New Student",
    email: studentData.email || `${id}@somaiya.edu`,
    avatar: studentData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
    program: studentData.program || "B.Tech Computer Science",
    department: studentData.department || "Computer Engineering",
    semester: studentData.semester || 1,
    academic_year: studentData.academic_year || "2024–2025",
    cgpa: studentData.cgpa || 8.5,
    total_credits: studentData.total_credits || 60,
    attendance_percentage: studentData.attendance_percentage || 90,
    bio: studentData.bio || "Student at Somaiya Vidyavihar University.",
    skills: studentData.skills || ["Python", "Algorithms"],
    enrolled_courses: studentData.enrolled_courses || ["course-cs301"],
    assigned_faculty_ids: studentData.assigned_faculty_ids || ["fac-smith"],
    attendance_history: studentData.attendance_history || [],
    projects: studentData.projects || [],
    internships: studentData.internships || [],
    clubs: studentData.clubs || [],
    certifications: studentData.certifications || [],
  };
  students.push(newStudent);
  saveStoredStudents(students);
  return newStudent;
}

export function updateStudent(id: string, updates: Partial<StudentProfile>): StudentProfile | null {
  const students = getStoredStudents();
  const idx = students.findIndex(s => s.student_id === id || s.student_id_number === id);
  if (idx === -1) return null;
  students[idx] = { ...students[idx], ...updates };
  saveStoredStudents(students);
  return students[idx];
}

export function archiveStudent(id: string): boolean {
  const students = getStoredStudents();
  const idx = students.findIndex(s => s.student_id === id || s.student_id_number === id);
  if (idx === -1) return false;
  students.splice(idx, 1);
  saveStoredStudents(students);
  return true;
}

// -------------------------------------------------------------
// Faculty CRUD
// -------------------------------------------------------------
export function addFaculty(facultyData: Partial<FacultyMember>): FacultyMember {
  const facultyList = getStoredFaculty();
  const id = facultyData.id || `fac-${Date.now()}`;
  const newFac: FacultyMember = {
    id,
    faculty_id: facultyData.faculty_id || `FAC-${Date.now()}`,
    name: facultyData.name || facultyData.full_name || "Faculty Member",
    full_name: facultyData.full_name || facultyData.name || "Faculty Member",
    email: facultyData.email || `${id}@somaiya.edu`,
    designation: facultyData.designation || "Assistant Professor",
    department: facultyData.department || "Computer Engineering",
    avatar: facultyData.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    office_location: facultyData.office_location || "SSBAS Block Room 302",
    office_hours: facultyData.office_hours || "Daily: 2:00 PM – 4:00 PM",
    qualifications: facultyData.qualifications || "Ph.D. in Computer Science",
    specialization: facultyData.specialization || ["Distributed Systems"],
    teaching_courses: facultyData.teaching_courses || ["course-cs301"],
    is_available: true,
    manual_status: "AVAILABLE",
    bio: facultyData.bio || "Distinguished faculty member at Somaiya Vidyavihar University.",
    phone: facultyData.phone || "+91 22 6728 3000",
  };
  facultyList.push(newFac);
  saveStoredFaculty(facultyList);
  return newFac;
}

export function updateFaculty(id: string, updates: Partial<FacultyMember>): FacultyMember | null {
  const facultyList = getStoredFaculty();
  const idx = facultyList.findIndex(f => f.id === id || f.faculty_id === id);
  if (idx === -1) return null;
  facultyList[idx] = { ...facultyList[idx], ...updates };
  saveStoredFaculty(facultyList);
  return facultyList[idx];
}

export function archiveFaculty(id: string): boolean {
  const facultyList = getStoredFaculty();
  const idx = facultyList.findIndex(f => f.id === id || f.faculty_id === id);
  if (idx === -1) return false;
  facultyList.splice(idx, 1);
  saveStoredFaculty(facultyList);
  return true;
}

// -------------------------------------------------------------
// Live Teacher Availability Computation
// -------------------------------------------------------------
export interface FacultyLiveAvailability {
  status: "AVAILABLE" | "IN CLASS" | "OFFICE HOURS" | "UNAVAILABLE";
  text: string;
  details: string;
  color: string;
  badgeVariant: "success" | "danger" | "warning" | "secondary";
  room?: string;
  currentCourse?: string;
}

export function getFacultyLiveAvailability(facultyId: string): FacultyLiveAvailability {
  const faculty = getFacultyById(facultyId);
  if (!faculty) {
    return {
      status: "AVAILABLE",
      text: "Available",
      details: "Faculty is on campus and available for academic inquiry",
      color: "#10b981",
      badgeVariant: "success",
    };
  }

  // Check manual status first
  if (faculty.manual_status === "UNAVAILABLE") {
    return {
      status: "UNAVAILABLE",
      text: "Unavailable",
      details: "Faculty is off-campus or engaged in university administration",
      color: "#6b7280",
      badgeVariant: "secondary",
    };
  }

  const timetable = getStoredTimetable();
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  const currentDay = days[now.getDay()] || "Monday";
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Find active lecture
  const activeClass = timetable.find(slot => {
    if (slot.faculty_id !== facultyId) return false;
    if (slot.day_of_week !== currentDay && currentDay !== "Sunday" && currentDay !== "Saturday") return false;
    if (slot.is_cancelled) return false;

    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;

    return nowMinutes >= startM && nowMinutes < endM;
  });

  if (activeClass) {
    return {
      status: "IN CLASS",
      text: `In Class: ${activeClass.course_code}`,
      details: `Conducting ${activeClass.course_name} in ${activeClass.room_number} until ${activeClass.end_time}`,
      color: "#ef4444",
      badgeVariant: "danger",
      room: activeClass.room_number,
      currentCourse: activeClass.course_code,
    };
  }

  if (faculty.manual_status === "OFFICE HOURS") {
    return {
      status: "OFFICE HOURS",
      text: "In Office Hours",
      details: `Available at ${faculty.office_location} (${faculty.office_hours})`,
      color: "#f59e0b",
      badgeVariant: "warning",
      room: faculty.office_location,
    };
  }

  // Check upcoming class today
  const nextClass = timetable
    .filter(slot => slot.faculty_id === facultyId && !slot.is_cancelled && (slot.day_of_week === currentDay || currentDay === "Sunday"))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .find(slot => {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      return sh * 60 + sm > nowMinutes;
    });

  return {
    status: "AVAILABLE",
    text: "Available Now",
    details: nextClass ? `Free until ${nextClass.start_time} (Next: ${nextClass.course_code} in ${nextClass.room_number})` : `Free for student consultations at ${faculty.office_location}`,
    color: "#10b981",
    badgeVariant: "success",
    room: faculty.office_location,
  };
}

// -------------------------------------------------------------
// 12. Somaiya Central Library Books & Study Guides Catalog
// -------------------------------------------------------------
export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  department?: string;
  shelf_location?: string;
  total_copies: number;
  available_copies: number;
  category: "Computer Science" | "Information Technology" | "Artificial Intelligence" | "Mathematics" | "General Engineering";
  cover_gradient?: string;
  edition?: string;
  is_reserved?: boolean;
}

export interface StudyGuide {
  id: string;
  title: string;
  course_code: string;
  course_name: string;
  semester: number;
  department: string;
  file_type: "pdf" | "cheatsheet" | "handbook";
  file_size: string;
  downloads_count: number;
  physical_copies_available: number;
  shelf_location: string;
  description: string;
  is_reserved?: boolean;
}

export const initialLibraryBooks: LibraryBook[] = [
  {
    id: "book-1",
    title: "Database System Concepts (7th Edition)",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    isbn: "978-0078022159",
    subject: "Database Management Systems",
    department: "Computer Engineering",
    shelf_location: "Stack 3 • Shelf 4B (CS Section)",
    total_copies: 8,
    available_copies: 5,
    category: "Computer Science",
    cover_gradient: "from-rose-900 to-neutral-900",
    edition: "7th International Student Edition",
  },
  {
    id: "book-2",
    title: "Introduction to Algorithms (CLRS 4th Edition)",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    isbn: "978-0262046305",
    subject: "Data Structures & Algorithms",
    department: "Computer Engineering & IT",
    shelf_location: "Stack 2 • Shelf 1A (Core Reference)",
    total_copies: 12,
    available_copies: 7,
    category: "Computer Science",
    cover_gradient: "from-blue-900 to-neutral-900",
    edition: "4th Edition (MIT Press)",
  },
  {
    id: "book-3",
    title: "Artificial Intelligence: A Modern Approach (4th Ed)",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    subject: "Machine Learning & AI",
    department: "AI & Data Science",
    shelf_location: "Stack 4 • Shelf 2C (AI/ML Collection)",
    total_copies: 10,
    available_copies: 6,
    category: "Artificial Intelligence",
    cover_gradient: "from-purple-900 to-neutral-900",
    edition: "4th Global Edition",
  },
  {
    id: "book-4",
    title: "Computer Networking: A Top-Down Approach (8th Ed)",
    author: "James F. Kurose, Keith W. Ross",
    isbn: "978-0136681557",
    subject: "Computer Networks & Cloud",
    department: "Information Technology",
    shelf_location: "Stack 3 • Shelf 2A (Networks Wing)",
    total_copies: 9,
    available_copies: 4,
    category: "Information Technology",
    cover_gradient: "from-emerald-900 to-neutral-900",
    edition: "8th Edition (Pearson)",
  },
  {
    id: "book-5",
    title: "Operating System Concepts (10th Edition)",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    isbn: "978-1119456339",
    subject: "Operating Systems",
    department: "Computer Engineering",
    shelf_location: "Stack 3 • Shelf 5A (Systems)",
    total_copies: 7,
    available_copies: 3,
    category: "Computer Science",
    cover_gradient: "from-amber-900 to-neutral-900",
    edition: "10th Dinosaur Book Edition",
  },
  {
    id: "book-6",
    title: "Deep Learning (Adaptive Computation and Machine Learning)",
    author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    isbn: "978-0262035613",
    subject: "Deep Learning & Neural Architectures",
    department: "AI & Data Science",
    shelf_location: "Stack 4 • Shelf 3A (Deep Learning)",
    total_copies: 6,
    available_copies: 4,
    category: "Artificial Intelligence",
    cover_gradient: "from-indigo-900 to-neutral-900",
    edition: "1st Hardcover Reference Edition",
  },
  {
    id: "book-7",
    title: "Linear Algebra and Its Applications (6th Edition)",
    author: "David C. Lay, Steven R. Lay, Judi J. McDonald",
    isbn: "978-0135851258",
    subject: "Applied Engineering Mathematics",
    department: "Basic and Applied Sciences (SSBAS)",
    shelf_location: "Stack 1 • Shelf 3C (Mathematics)",
    total_copies: 15,
    available_copies: 11,
    category: "Mathematics",
    cover_gradient: "from-cyan-900 to-neutral-900",
    edition: "6th Edition (Pearson)",
  },
  {
    id: "book-8",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    subject: "Software Engineering & Architecture",
    department: "Computer Applications",
    shelf_location: "Stack 2 • Shelf 4D (Best Practices)",
    total_copies: 8,
    available_copies: 5,
    category: "Computer Science",
    cover_gradient: "from-teal-900 to-neutral-900",
    edition: "1st Collector's Edition",
  }
];

export const initialStudyGuides: StudyGuide[] = [
  {
    id: "guide-1",
    title: "Comprehensive End-Sem Revision Guide: Data Structures & Algorithms",
    course_code: "IT201",
    course_name: "Data Structures & Algorithmic Complexity",
    semester: 4,
    department: "Information Technology",
    file_type: "pdf",
    file_size: "4.8 MB",
    downloads_count: 342,
    physical_copies_available: 5,
    shelf_location: "Library Reserves Desk • Counter A",
    description: "Full-semester study kit covering Trees, Heaps, Graph BFS/DFS, Dijkstra, Dynamic Programming proofs, and previous 5 years' solved Somaiya question papers.",
  },
  {
    id: "guide-2",
    title: "GATE Computer Science & IT Master Preparation Workbook 2026",
    course_code: "CS-GATE",
    course_name: "GATE Examination Prep Module",
    semester: 6,
    department: "Computer Engineering",
    file_type: "handbook",
    file_size: "12.4 MB",
    downloads_count: 518,
    physical_copies_available: 3,
    shelf_location: "Graduate Reserve Section • Rack G2",
    description: "Topic-wise multiple choice questions, numerical answer type (NAT) problems, and timed mock tests for Theory of Computation, Compiler Design, DBMS, and OS.",
  },
  {
    id: "guide-3",
    title: "DBMS & SQL Query Optimization Formula & Architecture Sheet",
    course_code: "CS301",
    course_name: "Database Management Systems & Architecture",
    semester: 4,
    department: "Computer Engineering",
    file_type: "cheatsheet",
    file_size: "1.6 MB",
    downloads_count: 289,
    physical_copies_available: 8,
    shelf_location: "Library Circulation Desk • Shelf 1B",
    description: "Compact laminated quick-reference card for Relational Algebra operators, B+ Tree split rules, 1NF to BCNF normalization algorithms, and ACID concurrency.",
  },
  {
    id: "guide-4",
    title: "Applied Engineering Mathematics: SVD & Differential Calculus Notes",
    course_code: "ME201",
    course_name: "Applied Engineering Mathematics & Linear Algebra",
    semester: 2,
    department: "Basic and Applied Sciences (SSBAS)",
    file_type: "pdf",
    file_size: "3.2 MB",
    downloads_count: 195,
    physical_copies_available: 6,
    shelf_location: "First Year Study Repository • Desk C",
    description: "Step-by-step solved proofs for Eigenvalues, Singular Value Decomposition, Orthogonalization (Gram-Schmidt), and Fourier Series representations.",
  },
  {
    id: "guide-5",
    title: "Machine Learning & Deep Learning Practical Lab Manual & Code Kit",
    course_code: "CS401",
    course_name: "Machine Learning & Neural Architectures",
    semester: 6,
    department: "Computer Engineering",
    file_type: "handbook",
    file_size: "6.5 MB",
    downloads_count: 420,
    physical_copies_available: 4,
    shelf_location: "AI Department Reserve • Counter 2",
    description: "PyTorch & Scikit-Learn complete lab walkthroughs with hyperparameter tuning guides, backprop derivation, and transformer architecture breakdown.",
  }
];

export function getStoredLibraryBooks(): LibraryBook[] {
  return safeGetStorage<LibraryBook[]>("nexus_library_books", initialLibraryBooks);
}

export function saveStoredLibraryBooks(books: LibraryBook[]): void {
  safeSetStorage("nexus_library_books", books);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-library-updated", { detail: books }));
}

export function reserveLibraryBook(bookId: string): { success: boolean; book: LibraryBook; message: string } {
  const books = getStoredLibraryBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) {
    throw new Error("Book not found in Somaiya Central Library catalog.");
  }
  if (book.available_copies <= 0) {
    throw new Error("No physical copies currently available for this title.");
  }

  book.available_copies -= 1;
  book.is_reserved = true;
  saveStoredLibraryBooks(books);

  addCentralNotification({
    title: `Book Reserved: ${book.title}`,
    message: `"${book.title}" by ${book.author} has been placed on 48-hour physical reserve for you. Location: ${book.shelf_location || "Library Desk"}. Please collect your copy with your Somaiya Student ID.`,
    type: "system",
    link: "/student/explore",
    course_code: book.subject,
    severity: "success",
  });

  return {
    success: true,
    book,
    message: `Reserved successfully! Collect within 48 hours at ${book.shelf_location || "Library Desk"}.`,
  };
}

export function getStoredStudyGuides(): StudyGuide[] {
  return safeGetStorage<StudyGuide[]>("nexus_study_guides", initialStudyGuides);
}

export function saveStoredStudyGuides(guides: StudyGuide[]): void {
  safeSetStorage("nexus_study_guides", guides);
  if (isBrowser) window.dispatchEvent(new CustomEvent("nexus-guides-updated", { detail: guides }));
}

export function reserveStudyGuide(guideId: string): { success: boolean; guide: StudyGuide; message: string } {
  const guides = getStoredStudyGuides();
  const guide = guides.find(g => g.id === guideId);
  if (!guide) {
    throw new Error("Study guide not found.");
  }
  if (guide.physical_copies_available > 0) {
    guide.physical_copies_available -= 1;
  }
  guide.downloads_count += 1;
  guide.is_reserved = true;
  saveStoredStudyGuides(guides);

  addCentralNotification({
    title: `Study Guide Reserved: ${guide.course_code}`,
    message: `Reserved "${guide.title}". Pick up physical print copy at ${guide.shelf_location} or access via your Student Portal.`,
    type: "material",
    link: "/student/explore",
    course_code: guide.course_code,
    severity: "success",
  });

  return {
    success: true,
    guide,
    message: `Guide reserved! Available at ${guide.shelf_location}.`,
  };
}



