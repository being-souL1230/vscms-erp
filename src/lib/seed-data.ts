// VSCMS - College of Management Studies
// Indian-style seed data: BCA, MBA, BBA scholars and faculty.
import type { User, Competition, CompetitionTeam, CompetitionSubmission, CompetitionEvaluation, CompetitionCertificate, LeaderboardEntry } from "@/types/erp";

export const initialUsers: User[] = [
  {
    id: 1,
    name: "Prof. (Dr.) Gauri Singh Gaur",
    email: "director@vscms.edu",
    role: "admin",
    subRole: "dean",
    rollNo: "1",
    rollNoOrEmpId: "1",
    department: "Office of the Director",
    designation: "Director & Dean, VSCMS",
    phone: "+91 11 4011 9001",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80",
    status: "active",
  },
  {
    id: 2,
    name: "Dr. Tanya Mishra",
    email: "tanya.m@vscms.edu",
    role: "faculty",
    subRole: "hod",
    rollNo: "2",
    rollNoOrEmpId: "2",
    department: "BCA (CSJM)",
    designation: "Professor of Computer Science · HOD",
    phone: "+91 11 4011 9142",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80",
    status: "active",
  },
  {
    id: 3,
    name: "Mr. Prakhar Tiwari",
    email: "prakhar.t@vscms.edu",
    role: "faculty",
    subRole: "coordinator",
    rollNo: "3",
    rollNoOrEmpId: "3",
    department: "MBA",
    designation: "Associate Professor · Class Coordinator",
    phone: "+91 11 4011 9221",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80",
    status: "active",
  },
  {
    id: 4,
    name: "Mr. Ayush Yadav",
    email: "ayush.y@vscms.edu",
    role: "faculty",
    subRole: "teacher",
    rollNo: "4",
    rollNoOrEmpId: "4",
    department: "BCA (MCU)",
    designation: "Assistant Professor & Subject Teacher",
    phone: "+91 11 4011 9098",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80",
    status: "active",
  },
  {
    id: 101,
    name: "Aarav Rao",
    email: "aarav.r@vscms.edu",
    role: "student",
    subRole: "student",
    rollNo: "101",
    rollNoOrEmpId: "101",
    department: "BCA (CSJM)",
    semester: 3,
    phone: "+91 98200 11431",
    avatarUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80",
    gpa: "3.81",
    status: "active",
  },
  {
    id: 102,
    name: "Priya Nair",
    email: "priya.n@vscms.edu",
    role: "student",
    rollNo: "102",
    rollNoOrEmpId: "102",
    department: "BCA (MCU)",
    semester: 3,
    phone: "+91 98200 22718",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
    gpa: "3.92",
    status: "active",
  },
  {
    id: 103,
    name: "Rohan Das",
    email: "rohan.d@vscms.edu",
    role: "student",
    rollNo: "103",
    rollNoOrEmpId: "103",
    department: "MBA",
    semester: 2,
    phone: "+91 98200 33007",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80",
    gpa: "3.66",
    status: "active",
  },
  {
    id: 104,
    name: "Meera Iyer",
    email: "meera.i@vscms.edu",
    role: "student",
    rollNo: "104",
    rollNoOrEmpId: "104",
    department: "BBA",
    semester: 2,
    phone: "+91 98200 44012",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80",
    gpa: "3.74",
    status: "active",
  },
  {
    id: 105,
    name: "Kabir Shah",
    email: "kabir.s@vscms.edu",
    role: "student",
    rollNo: "105",
    rollNoOrEmpId: "105",
    department: "BCA (CSJM)",
    semester: 4,
    phone: "+91 98200 55044",
    avatarUrl:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=160&auto=format&fit=crop&q=80",
    gpa: "3.48",
    status: "active",
  },
];

export const initialDepartments = [
  {
    code: "BCA-CSJM",
    name: "BCA (CSJM)",
    headOfDepartment: "Dr. Tanya Mishra",
    location: "Computer Wing · Level 1",
    studentCount: 120,
    facultyCount: 8,
  },
  {
    code: "BCA-MCU",
    name: "BCA (MCU)",
    headOfDepartment: "Mr. Ayush Yadav",
    location: "Computer Wing · Level 2",
    studentCount: 95,
    facultyCount: 6,
  },
  {
    code: "MBA",
    name: "MBA",
    headOfDepartment: "Mr. Prakhar Tiwari",
    location: "Management Block · Level 3",
    studentCount: 80,
    facultyCount: 10,
  },
  {
    code: "BBA",
    name: "BBA",
    headOfDepartment: "Mrs. Shruti Agarwal",
    location: "Management Block · Level 2",
    studentCount: 110,
    facultyCount: 7,
  },
];

export const initialCourses = [
  {
    code: "BCA101",
    name: "Introduction to Programming",
    department: "BCA (CSJM)",
    credits: 4,
    semester: 1,
    facultyName: "Dr. Tanya Mishra",
    room: "Lab 1 · LT-101",
    schedule: "Mon · Wed · Fri  09:00 10:30",
    description:
      "Basics of programming with Python. Variables, loops, functions and simple projects.",
  },
  {
    code: "BCA201",
    name: "Data Structures & Algorithms",
    department: "BCA (CSJM)",
    credits: 4,
    semester: 2,
    facultyName: "Dr. Tanya Mishra",
    room: "Lab 2 · LT-202",
    schedule: "Tue · Thu  09:00 10:30",
    description:
      "Arrays, linked lists, stacks, queues, trees and sorting algorithms.",
  },
  {
    code: "BCA301",
    name: "Database Management Systems",
    department: "BCA (CSJM)",
    credits: 3,
    semester: 3,
    facultyName: "Mr. Ayush Yadav",
    room: "Lab 1 · LT-101",
    schedule: "Mon · Wed  11:00 12:30",
    description:
      "SQL, relational databases, normalization and basic database design.",
  },
  {
    code: "MBA101",
    name: "Principles of Management",
    department: "MBA",
    credits: 3,
    semester: 1,
    facultyName: "Mr. Prakhar Tiwari",
    room: "Hall 1 · MH-101",
    schedule: "Tue · Thu  11:00 12:30",
    description:
      "Introduction to management concepts, planning, organizing, leading and controlling.",
  },
  {
    code: "MBA201",
    name: "Marketing Management",
    department: "MBA",
    credits: 3,
    semester: 2,
    facultyName: "Mr. Prakhar Tiwari",
    room: "Hall 2 · MH-202",
    schedule: "Mon · Wed  14:00 15:30",
    description:
      "Market research, consumer behaviour, branding and digital marketing basics.",
  },
  {
    code: "BBA101",
    name: "Business Communication",
    department: "BBA",
    credits: 3,
    semester: 1,
    facultyName: "Mrs. Shruti Agarwal",
    room: "Hall 1 · MH-101",
    schedule: "Tue · Thu  09:00 10:30",
    description:
      "Business writing, presentations, email etiquette and professional communication skills.",
  },
  {
    code: "BBA201",
    name: "Financial Accounting",
    department: "BBA",
    credits: 3,
    semester: 2,
    facultyName: "Mrs. Shruti Agarwal",
    room: "Hall 2 · MH-202",
    schedule: "Mon · Wed  11:00 12:30",
    description:
      "Basic accounting principles, ledger entries, balance sheets and profit & loss statements.",
  },
  {
    code: "BCA401",
    name: "Web Development",
    department: "BCA (CSJM)",
    credits: 3,
    semester: 4,
    facultyName: "Mr. Ayush Yadav",
    room: "Lab 2 · LT-202",
    schedule: "Fri  11:00 14:00",
    description:
      "HTML, CSS, JavaScript basics and building simple web pages.",
  },
];

export const initialNotices = [
  {
    title: "Exam Schedule Released",
    content:
      "The exam schedule has been posted. Students must check their dates and prepare accordingly. Contact the office for any changes.",
    category: "Exam",
    priority: "urgent",
    authorName: "Exam Cell",
    publishedDate: "2026-03-15",
  },
  {
    title: "Library Books Return Deadline",
    content:
      "All library books must be returned by 31 March. Late returns will attract a fine of ₹50 per day. Students are requested to clear their dues.",
    category: "Academic",
    priority: "normal",
    authorName: "Library Office",
    publishedDate: "2026-03-12",
  },
  {
    title: "Fee Payment Last Date",
    content:
      "The last date for clearing tuition and lab fees is 31 March 2026. Pay online or visit the bursar office. Late fee of ₹200 applies after the deadline.",
    category: "Fee",
    priority: "urgent",
    authorName: "Bursar Office",
    publishedDate: "2026-03-10",
  },
  {
    title: "Guest Lecture on AI in Business",
    content:
      "An alumnus working in AI will give a guest talk this Friday at 3 PM in the Seminar Hall. All students are welcome. Certificates will be provided.",
    category: "Event",
    priority: "normal",
    authorName: "Training & Placement Cell",
    publishedDate: "2026-03-08",
  },
];

export const initialCourseMaterials = [
  {
    id: 1,
    courseId: 1,
    courseCode: "BCA101",
    courseName: "Introduction to Programming",
    moduleName: "Module 1: Python Basics & Syntax",
    title: "Python Syntax, Variables & Basic Data Types Notes",
    description: "Complete reference lecture notes covering variables, primitive data types, input/output, and basic operators.",
    type: "Notes" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "1.8 MB",
    facultyId: 3,
    facultyName: "Dr. Tanya Mishra",
    downloadCount: 42,
  },
  {
    id: 2,
    courseId: 1,
    courseCode: "BCA101",
    courseName: "Introduction to Programming",
    moduleName: "Module 1: Python Basics & Syntax",
    title: "Control Flow & Loops Presentation",
    description: "Slide deck for Module 1 Topic 2: If-else conditionals, for loops, while loops, and break/continue statements.",
    type: "PPT" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "4.2 MB",
    facultyId: 3,
    facultyName: "Dr. Tanya Mishra",
    downloadCount: 38,
  },
  {
    id: 3,
    courseId: 1,
    courseCode: "BCA101",
    courseName: "Introduction to Programming",
    moduleName: "Module 2: Functions & Modular Coding",
    title: "Functions, Parameters & Return Values PDF",
    description: "Comprehensive study material on defining functions, scope, default arguments, and lambda expressions.",
    type: "PDF" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "2.5 MB",
    facultyId: 3,
    facultyName: "Dr. Tanya Mishra",
    downloadCount: 29,
  },
  {
    id: 4,
    courseId: 1,
    courseCode: "BCA101",
    courseName: "Introduction to Programming",
    moduleName: "Module 2: Functions & Modular Coding",
    title: "Building Python Functions Lab Recording",
    description: "Video lecture demonstration of solving lab exercises using custom functions and exception handling.",
    type: "Video" as const,
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    fileSize: "45.0 MB",
    facultyId: 3,
    facultyName: "Dr. Tanya Mishra",
    downloadCount: 51,
  },
  {
    id: 5,
    courseId: 2,
    courseCode: "BCA201",
    courseName: "Data Structures & Algorithms",
    moduleName: "Module 1: Linear Data Structures",
    title: "Arrays, Linked Lists & Stack Applications",
    description: "Detailed notes on array memory layout, singly and doubly linked lists, stack push/pop, and infix-to-postfix conversion.",
    type: "PDF" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "3.1 MB",
    facultyId: 3,
    facultyName: "Dr. Tanya Mishra",
    downloadCount: 64,
  },
  {
    id: 6,
    courseId: 3,
    courseCode: "BCA301",
    courseName: "Database Management Systems",
    moduleName: "Module 1: Relational Architecture & ER Modeling",
    title: "Entity-Relationship Diagrams & Normalization (1NF to 3NF)",
    description: "Slide deck covering ER diagrams, candidate keys, functional dependencies, and normalization steps.",
    type: "PPT" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "5.6 MB",
    facultyId: 4,
    facultyName: "Mr. Ayush Yadav",
    downloadCount: 33,
  },
  {
    id: 7,
    courseId: 4,
    courseCode: "MBA101",
    courseName: "Principles of Management",
    moduleName: "Module 1: Management Theories & Organisational Behaviour",
    title: "Classic & Modern Management Thought Case Reading",
    description: "Required reading material on Taylor's scientific management and Fayol's 14 principles of management.",
    type: "Notes" as const,
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "1.2 MB",
    facultyId: 5,
    facultyName: "Mr. Prakhar Tiwari",
    downloadCount: 19,
  },
];

export const initialAuditLogs = [
  {
    id: 1,
    user: "Prof. (Dr.) Gauri Singh Gaur (Admin)",
    userRole: "admin" as const,
    action: "Updated Student Attendance",
    module: "Attendance",
    record: "Aarav Rao (2024-BCA-001)",
    timestamp: "18 Aug 2026, 14:32:05",
    ipAddress: "192.168.1.42 (Chrome 127 · Windows 11)",
    oldValue: "Attendance: 72% (18/25 classes)",
    newValue: "Attendance: 78% (20/25 classes)",
    severity: "info" as const,
  },
  {
    id: 2,
    user: "Dr. Tanya Mishra (Faculty)",
    userRole: "faculty" as const,
    action: "Approved Student ID Card Verification",
    module: "ID Verification",
    record: "Aarav Rao (2024-BCA-001)",
    timestamp: "18 Aug 2026, 10:30:12",
    ipAddress: "192.168.1.18 (Safari 17 · macOS Sonoma)",
    oldValue: "Status: Pending Faculty Sign-off",
    newValue: "Status: Institutionally Verified",
    severity: "info" as const,
  },
  {
    id: 3,
    user: "Prof. (Dr.) Gauri Singh Gaur (Admin)",
    userRole: "admin" as const,
    action: "Generated Batch Term Fee Invoices",
    module: "Fees",
    record: "BCA Semester 3 Batch (24 Scholars)",
    timestamp: "17 Aug 2026, 16:45:00",
    ipAddress: "192.168.1.42 (Chrome 127 · Windows 11)",
    oldValue: "Unbilled ($0.00)",
    newValue: "Billed ($12,500.00 total)",
    severity: "warning" as const,
  },
  {
    id: 4,
    user: "Mr. Ayush Yadav (Faculty)",
    userRole: "faculty" as const,
    action: "Recorded Batch Internal Marks",
    module: "Exams",
    record: "BCA301 - Database Management Systems",
    timestamp: "16 Aug 2026, 11:20:44",
    ipAddress: "192.168.1.89 (Edge 126 · Windows 11)",
    oldValue: "Draft Status",
    newValue: "Published & Verified Marks",
    severity: "info" as const,
  },
  {
    id: 5,
    user: "Prof. (Dr.) Gauri Singh Gaur (Admin)",
    userRole: "admin" as const,
    action: "Modified User Role & Permissions",
    module: "System Admin",
    record: "Dr. Tanya Mishra (HOD Computer Science)",
    timestamp: "15 Aug 2026, 09:12:30",
    ipAddress: "192.168.1.42 (Chrome 127 · Windows 11)",
    oldValue: "Permissions: CanView=1, CanEdit=0",
    newValue: "Permissions: CanView=1, CanEdit=1, CanApprove=1",
    severity: "critical" as const,
  },
  {
    id: 6,
    user: "Dr. Tanya Mishra (Faculty)",
    userRole: "faculty" as const,
    action: "Uploaded Course Material Resource",
    module: "Course Materials",
    record: "FIN601_Corporate_Valuation_Manual.pdf",
    timestamp: "14 Aug 2026, 15:05:19",
    ipAddress: "192.168.1.18 (Safari 17 · macOS Sonoma)",
    oldValue: "Resource: None",
    newValue: "Resource Uploaded (2.4 MB PDF)",
    severity: "info" as const,
  },
];

export const initialCampusEvents = [
  {
    id: 1,
    title: "VSCMS National FinTech & AI Summit 2026",
    code: "EVT-2026-FIN",
    date: "2026-08-25",
    time: "10:00 AM - 04:00 PM",
    venue: "Main Auditorium · Block A",
    department: "Computer Applications & Management",
    createdBy: "Dr. Tanya Mishra (Faculty HOD)",
    coordinators: ["101", "102"], // Aarav Rao & Priya Nair assigned as Student Coordinators!
    description: "Annual national conference on Artificial Intelligence in Financial Management and Algorithmic Trading.",
  },
  {
    id: 2,
    title: "Annual Industry Management Conclave",
    code: "EVT-2026-MGT",
    date: "2026-09-05",
    time: "11:00 AM - 03:30 PM",
    venue: "Seminar Hall 2 · Management Wing",
    department: "MBA & BBA",
    createdBy: "Mr. Prakhar Tiwari (Faculty Lead)",
    coordinators: ["103"], // Rohan Das assigned as Coordinator!
    description: "Panel discussion with corporate executives on ESG governance, leadership, and venture capital.",
  },
];

export const initialEventRegistrations = [
  {
    id: 1,
    eventId: 1,
    studentId: 101,
    studentName: "Aarav Rao",
    rollNo: "101",
    department: "BCA (CSJM)",
    registeredAt: "2026-08-15 11:00 AM",
    attendanceStatus: "present" as const,
    verifiedBy: "Dr. Tanya Mishra (Faculty)",
    verifiedAt: "2026-08-18 10:15 AM",
    qrRound: "QR-01",
  },
  {
    id: 2,
    eventId: 1,
    studentId: 102,
    studentName: "Priya Nair",
    rollNo: "102",
    department: "BCA (MCU)",
    registeredAt: "2026-08-15 11:15 AM",
    attendanceStatus: "pending_verification" as const,
    verifiedBy: null,
    verifiedAt: null,
    qrRound: "QR-01",
  },
  {
    id: 3,
    eventId: 1,
    studentId: 103,
    studentName: "Rohan Das",
    rollNo: "103",
    department: "MBA",
    registeredAt: "2026-08-16 09:30 AM",
    attendanceStatus: "not_scanned" as const,
    verifiedBy: null,
    verifiedAt: null,
    qrRound: null,
  },
  {
    id: 4,
    eventId: 1,
    studentId: 104,
    studentName: "Meera Iyer",
    rollNo: "104",
    department: "BBA",
    registeredAt: "2026-08-16 10:00 AM",
    attendanceStatus: "not_scanned" as const,
    verifiedBy: null,
    verifiedAt: null,
    qrRound: null,
  },
];

export const initialAttendance = [
  // Aarav Rao (101)
  { id: 1, studentId: 101, studentName: "Aarav Rao", courseCode: "BCA101", date: "2026-08-10", status: "present" as const, period: 1 },
  { id: 2, studentId: 101, studentName: "Aarav Rao", courseCode: "BCA201", date: "2026-08-11", status: "present" as const, period: 2 },
  { id: 3, studentId: 101, studentName: "Aarav Rao", courseCode: "BCA301", date: "2026-08-12", status: "late" as const, period: 3 },
  // Priya Nair (102)
  { id: 4, studentId: 102, studentName: "Priya Nair", courseCode: "BCA101", date: "2026-08-10", status: "present" as const, period: 1 },
  { id: 5, studentId: 102, studentName: "Priya Nair", courseCode: "BCA201", date: "2026-08-11", status: "present" as const, period: 2 },
  { id: 6, studentId: 102, studentName: "Priya Nair", courseCode: "BCA301", date: "2026-08-12", status: "present" as const, period: 3 },
  // Rohan Das (103)
  { id: 7, studentId: 103, studentName: "Rohan Das", courseCode: "MBA101", date: "2026-08-10", status: "present" as const, period: 1 },
  { id: 8, studentId: 103, studentName: "Rohan Das", courseCode: "MBA201", date: "2026-08-11", status: "present" as const, period: 2 },
  // Meera Iyer (104)
  { id: 9, studentId: 104, studentName: "Meera Iyer", courseCode: "BBA101", date: "2026-08-10", status: "present" as const, period: 1 },
  { id: 10, studentId: 104, studentName: "Meera Iyer", courseCode: "BBA201", date: "2026-08-11", status: "present" as const, period: 2 },
  // Kabir Shah (105)
  { id: 11, studentId: 105, studentName: "Kabir Shah", courseCode: "BCA401", date: "2026-08-10", status: "present" as const, period: 1 },
  { id: 12, studentId: 105, studentName: "Kabir Shah", courseCode: "BCA101", date: "2026-08-11", status: "late" as const, period: 2 },
];

export const initialInternalMarks = [
  // Aarav Rao (101)
  { id: 1, studentId: 101, studentName: "Aarav Rao", rollNo: "101", courseCode: "BCA101", courseName: "Intro to Programming", examType: "Mid-Term", marksObtained: "44", maxTotal: "50", gradeLetter: "A+", result: "pass" as const, status: "approved" },
  { id: 2, studentId: 101, studentName: "Aarav Rao", rollNo: "101", courseCode: "BCA201", courseName: "Data Structures", examType: "Sessional", marksObtained: "42", maxTotal: "50", gradeLetter: "A", result: "pass" as const, status: "approved" },
  // Priya Nair (102)
  { id: 3, studentId: 102, studentName: "Priya Nair", rollNo: "102", courseCode: "BCA101", courseName: "Intro to Programming", examType: "Mid-Term", marksObtained: "48", maxTotal: "50", gradeLetter: "O", result: "pass" as const, status: "approved" },
  { id: 4, studentId: 102, studentName: "Priya Nair", rollNo: "102", courseCode: "BCA201", courseName: "Data Structures", examType: "Sessional", marksObtained: "46", maxTotal: "50", gradeLetter: "A+", result: "pass" as const, status: "approved" },
  // Rohan Das (103)
  { id: 5, studentId: 103, studentName: "Rohan Das", rollNo: "103", courseCode: "MBA101", courseName: "Principles of Management", examType: "Mid-Term", marksObtained: "43", maxTotal: "50", gradeLetter: "A", result: "pass" as const, status: "approved" },
  { id: 6, studentId: 103, studentName: "Rohan Das", rollNo: "103", courseCode: "MBA201", courseName: "Marketing Management", examType: "Sessional", marksObtained: "41", maxTotal: "50", gradeLetter: "A", result: "pass" as const, status: "approved" },
  // Meera Iyer (104)
  { id: 7, studentId: 104, studentName: "Meera Iyer", rollNo: "104", courseCode: "BBA101", courseName: "Business Communication", examType: "Mid-Term", marksObtained: "45", maxTotal: "50", gradeLetter: "A+", result: "pass" as const, status: "approved" },
  { id: 8, studentId: 104, studentName: "Meera Iyer", rollNo: "104", courseCode: "BBA201", courseName: "Financial Accounting", examType: "Sessional", marksObtained: "42", maxTotal: "50", gradeLetter: "A", result: "pass" as const, status: "approved" },
  // Kabir Shah (105)
  { id: 9, studentId: 105, studentName: "Kabir Shah", rollNo: "105", courseCode: "BCA401", courseName: "Web Development", examType: "Mid-Term", marksObtained: "39", maxTotal: "50", gradeLetter: "B+", result: "pass" as const, status: "approved" },
];

export const initialFees = [
  // Aarav Rao (101)
  { id: 1, studentId: 101, studentName: "Aarav Rao", semester: "Sem 3", feeType: "Tuition Fee", totalAmount: 35000, paidAmount: 35000, dueDate: "2026-08-31", status: "paid" as const },
  { id: 2, studentId: 101, studentName: "Aarav Rao", semester: "Sem 3", feeType: "Exam & Lab Fee", totalAmount: 5000, paidAmount: 0, dueDate: "2026-09-15", status: "pending" as const },
  // Priya Nair (102)
  { id: 3, studentId: 102, studentName: "Priya Nair", semester: "Sem 3", feeType: "Tuition Fee", totalAmount: 35000, paidAmount: 35000, dueDate: "2026-08-31", status: "paid" as const },
  { id: 4, studentId: 102, studentName: "Priya Nair", semester: "Sem 3", feeType: "Exam & Lab Fee", totalAmount: 5000, paidAmount: 5000, dueDate: "2026-09-15", status: "paid" as const },
  // Rohan Das (103)
  { id: 5, studentId: 103, studentName: "Rohan Das", semester: "Sem 2", feeType: "MBA Tuition Fee", totalAmount: 55000, paidAmount: 55000, dueDate: "2026-08-31", status: "paid" as const },
  // Meera Iyer (104)
  { id: 6, studentId: 104, studentName: "Meera Iyer", semester: "Sem 2", feeType: "BBA Tuition Fee", totalAmount: 30000, paidAmount: 30000, dueDate: "2026-08-31", status: "paid" as const },
  // Kabir Shah (105)
  { id: 7, studentId: 105, studentName: "Kabir Shah", semester: "Sem 4", feeType: "Tuition Fee", totalAmount: 35000, paidAmount: 20000, dueDate: "2026-08-31", status: "partial" as const },
];

export const initialAdmissions = [
  { id: 1, studentId: 101, studentName: "Aarav Rao", rollNo: "101", fatherName: "Rajesh Rao", motherName: "Sunita Rao", category: "General", address: "12/4 Avas Vikas, Kanpur", bloodGroup: "B+", dob: "2004-05-14", status: "confirmed" },
  { id: 2, studentId: 102, studentName: "Priya Nair", rollNo: "102", fatherName: "K. V. Nair", motherName: "Lakshmi Nair", category: "General", address: "45 Civil Lines, Kanpur", bloodGroup: "O+", dob: "2004-09-21", status: "confirmed" },
  { id: 3, studentId: 103, studentName: "Rohan Das", rollNo: "103", fatherName: "S. K. Das", motherName: "Anjali Das", category: "OBC", address: "78 Swaroop Nagar, Kanpur", bloodGroup: "A+", dob: "2003-11-05", status: "confirmed" },
  { id: 4, studentId: 104, studentName: "Meera Iyer", rollNo: "104", fatherName: "R. Iyer", motherName: "Geeta Iyer", category: "General", address: "89 Kakadeo, Kanpur", bloodGroup: "AB+", dob: "2004-02-18", status: "confirmed" },
  { id: 5, studentId: 105, studentName: "Kabir Shah", rollNo: "105", fatherName: "V. K. Shah", motherName: "Rekha Shah", category: "General", address: "23 Kidwai Nagar, Kanpur", bloodGroup: "O-", dob: "2003-07-29", status: "confirmed" },
];

export const initialDocuments = [
  { id: 1, studentId: 101, title: "10th High School Marksheet", category: "Academic", fileName: "Aarav_10th_Marksheet.pdf", mimeType: "application/pdf", fileSize: 1024500, uploadedAt: "2024-07-15", verificationStatus: "verified" as const },
  { id: 2, studentId: 102, title: "12th Intermediate Marksheet", category: "Academic", fileName: "Priya_12th_Marksheet.pdf", mimeType: "application/pdf", fileSize: 1145000, uploadedAt: "2024-07-16", verificationStatus: "verified" as const },
  { id: 3, studentId: 103, title: "Graduation Degree Marksheet", category: "Academic", fileName: "Rohan_Degree.pdf", mimeType: "application/pdf", fileSize: 2048000, uploadedAt: "2025-07-10", verificationStatus: "verified" as const },
  { id: 4, studentId: 104, title: "Class 12th Certificate", category: "Academic", fileName: "Meera_12th.pdf", mimeType: "application/pdf", fileSize: 980000, uploadedAt: "2025-07-12", verificationStatus: "verified" as const },
  { id: 5, studentId: 105, title: "Transfer & Migration Certificate", category: "Official", fileName: "Kabir_TC.pdf", mimeType: "application/pdf", fileSize: 1450000, uploadedAt: "2024-07-20", verificationStatus: "verified" as const },
];

export const initialCompetitions: Competition[] = [
  {
    id: 1,
    title: "VSCMS National Hackathon 2026",
    description: "Annual flagship 24-hour hackathon bringing together student developers & innovators to solve campus and industry problems.",
    type: "Hackathon",
    regStart: "2026-03-01",
    regEnd: "2026-03-25",
    compDate: "2026-03-28",
    teamSizeMin: 2,
    teamSizeMax: 4,
    eligibilityDept: "All Departments",
    rules: "1. Build original working software during hackathon window.\n2. GitHub repository must be public.\n3. Plagiarism leads to instant disqualification.",
    problemStatements: "Track 1: AI ERP Copilot & Smart Assistant\nTrack 2: Blockchain Verified Student Records\nTrack 3: Real-Time Attendance & Access Gate",
    submissionDeadline: "2026-03-28 18:00",
    evaluationCriteria: "Innovation (20), Technical (20), UI/UX (20), Impact (20), Presentation (20)",
    prizes: "🥇 1st: ₹50,000 | 🥈 2nd: ₹30,000 | 🥉 3rd: ₹15,000",
    isLeaderboardPublished: 1,
    status: "ongoing",
    createdAt: "2026-03-01 10:00:00"
  },
  {
    id: 2,
    title: "CodeBlitz Algorithmic Challenge 2026",
    description: "High-speed competitive coding battle testing speed, logic, and data structure optimizations.",
    type: "Coding Contest",
    regStart: "2026-02-10",
    regEnd: "2026-02-20",
    compDate: "2026-02-22",
    teamSizeMin: 1,
    teamSizeMax: 1,
    eligibilityDept: "BCA (CSJM), BCA (MCU)",
    rules: "Individual contest. Standard competitive coding environment rules.",
    problemStatements: "5 Algorithmic challenges ranging from Graph Algorithms to Dynamic Programming.",
    submissionDeadline: "2026-02-22 17:00",
    evaluationCriteria: "Automated test cases passed + Execution time efficiency",
    prizes: "🥇 1st: ₹10,000 + Medal | 🥈 2nd: ₹5,000",
    isLeaderboardPublished: 1,
    status: "completed",
    createdAt: "2026-02-10 09:00:00"
  },
  {
    id: 3,
    title: "National Business Case Competition 2026",
    description: "Formulate strategic marketing & financial turnarounds for real-world enterprise case studies.",
    type: "Case Competition",
    regStart: "2026-04-01",
    regEnd: "2026-04-15",
    compDate: "2026-04-20",
    teamSizeMin: 2,
    teamSizeMax: 4,
    eligibilityDept: "MBA, BBA",
    rules: "Executive presentation decks required in PDF format.",
    problemStatements: "Corporate Valuation & ESG Transformation Strategy for Tech Logistics.",
    submissionDeadline: "2026-04-20 12:00",
    evaluationCriteria: "Financial Analysis (30), Innovation (30), Pitch Presentation (40)",
    prizes: "🥇 1st: ₹25,000 + Internship Interview",
    isLeaderboardPublished: 0,
    status: "open",
    createdAt: "2026-04-01 08:00:00"
  }
];

export const initialCompetitionTeams: CompetitionTeam[] = [
  {
    id: 1,
    competitionId: 1,
    teamName: "Code Warriors",
    captainId: 101,
    captainName: "Aarav Rao",
    isLocked: 1,
    createdAt: "2026-03-05 14:20:00",
    members: [
      { id: 1, teamId: 1, userId: 101, userName: "Aarav Rao", email: "aarav.r@vscms.edu", roleInTeam: "captain", status: "accepted" },
      { id: 2, teamId: 1, userId: 102, userName: "Priya Nair", email: "priya.n@vscms.edu", roleInTeam: "member", status: "accepted" },
      { id: 3, teamId: 1, userId: 103, userName: "Rohan Das", email: "rohan.d@vscms.edu", roleInTeam: "member", status: "invited" }
    ]
  },
  {
    id: 2,
    competitionId: 1,
    teamName: "Tech Titans",
    captainId: 104,
    captainName: "Meera Iyer",
    isLocked: 1,
    createdAt: "2026-03-06 11:10:00",
    members: [
      { id: 4, teamId: 2, userId: 104, userName: "Meera Iyer", email: "meera.i@vscms.edu", roleInTeam: "captain", status: "accepted" },
      { id: 5, teamId: 2, userId: 105, userName: "Kabir Shah", email: "kabir.s@vscms.edu", roleInTeam: "member", status: "accepted" }
    ]
  }
];

export const initialCompetitionSubmissions: CompetitionSubmission[] = [
  {
    id: 1,
    competitionId: 1,
    teamId: 1,
    teamName: "Code Warriors",
    projectTitle: "Smart Campus AI ERP Copilot",
    description: "An autonomous AI assistant integrated into college ERP for instant attendance queries, automated grading, and financial ledger breakdown.",
    githubUrl: "https://github.com/vscms-org/smart-campus-ai",
    demoUrl: "https://ai-erp.vscms.edu",
    pptUrl: "https://vscms.edu/docs/code-warriors-deck.pdf",
    screenshotsUrl: "https://vscms.edu/assets/demo-ui.png",
    videoUrl: "https://youtube.com/watch?v=demo_warriors",
    isLocked: 1,
    submittedAt: "2026-03-28 16:45:00"
  },
  {
    id: 2,
    competitionId: 1,
    teamId: 2,
    teamName: "Tech Titans",
    projectTitle: "Placement Predictor & Career Vault",
    description: "Machine learning platform analyzing student academic performance, hackathons, and certifications to predict campus placement readiness.",
    githubUrl: "https://github.com/vscms-org/career-vault",
    demoUrl: "https://placement.vscms.edu",
    pptUrl: "https://vscms.edu/docs/tech-titans-presentation.pdf",
    screenshotsUrl: "https://vscms.edu/assets/titans-screen.png",
    videoUrl: "https://youtube.com/watch?v=demo_titans",
    isLocked: 1,
    submittedAt: "2026-03-28 17:30:00"
  }
];

export const initialLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: 1, teamName: "Code Warriors", projectTitle: "Smart Campus AI ERP Copilot", score: 91.4, judgeCount: 3 },
  { rank: 2, teamId: 2, teamName: "Tech Titans", projectTitle: "Placement Predictor & Career Vault", score: 86.8, judgeCount: 3 },
  { rank: 3, teamId: 3, teamName: "ByteForce", projectTitle: "Blockchain Verified Ledger", score: 82.5, judgeCount: 2 }
];

export const initialCertificates: CompetitionCertificate[] = [
  {
    id: 1,
    competitionId: 2,
    competitionTitle: "CodeBlitz Algorithmic Challenge 2026",
    userId: 101,
    userName: "Aarav Rao",
    teamName: "Code Warriors",
    certType: "winner_1st",
    certCode: "VSCMS-CERT-2026-CODEBLITZ-101",
    qrPayload: "VERIFIED: 1st Place Winner - CodeBlitz Algorithmic Challenge 2026 - Aarav Rao | Cert: VSCMS-CERT-2026-CODEBLITZ-101",
    issuedAt: "2026-02-23 10:00:00"
  },
  {
    id: 2,
    competitionId: 2,
    competitionTitle: "National Business Case Competition 2026",
    userId: 101,
    userName: "Aarav Rao",
    teamName: "Strategy Squad",
    certType: "winner_2nd",
    certCode: "VSCMS-CERT-2026-CASE-101",
    qrPayload: "VERIFIED: 2nd Place Runner-Up - National Business Case Competition 2026 - Aarav Rao | Cert: VSCMS-CERT-2026-CASE-101",
    issuedAt: "2026-01-15 14:30:00"
  }
];
