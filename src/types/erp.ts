export type UserRole = "admin" | "faculty" | "student";
export type SubRole = "dean" | "hod" | "coordinator" | "teacher" | "student";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  subRole?: SubRole;
  rollNo: string;
  rollNoOrEmpId?: string;
  department: string;
  semester?: number | null;
  designation?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gpa?: string | null;
  status: string;
  createdAt?: string;
}

export function canAlterStudentRecords(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.subRole === "dean" || user.subRole === "hod" || user.subRole === "coordinator") return true;
  if (user.subRole === "teacher") return false;
  if (user.role === "faculty") {
    const des = (user.designation || "").toLowerCase();
    if (des.includes("hod") || des.includes("director") || des.includes("coordinator") || des.includes("head") || des.includes("lead")) {
      return true;
    }
    return false;
  }
  return false;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  headOfDepartment: string;
  location?: string | null;
  studentCount?: number | null;
  facultyCount?: number | null;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  department: string;
  credits: number;
  semester: number;
  facultyId?: number | null;
  facultyName?: string | null;
  room?: string | null;
  schedule?: string | null;
  description?: string | null;
}

export interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseCode: string;
  date: string;
  status: "present" | "absent" | "late";
  period?: string | null;
  markedBy?: string | null;
}

export interface GradeRecord {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  examType: string;
  marksObtained: string;
  maxMarks: string;
  gradeLetter: string;
  semester: number;
  remarks?: string | null;
}

export interface FeeRecord {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  feeType: string;
  amount: string;
  dueDate: string;
  paidDate?: string | null;
  status: "paid" | "pending" | "overdue";
  receiptNumber?: string | null;
  paymentMethod?: string | null;
  courseCode?: string | null;
  courseName?: string | null;
  semester?: number | null;
  /** Running total already paid (supports partial / installment payments). */
  paidAmount?: string | null;
  /** Who last recorded a payment (admin, bursar or faculty). */
  collectedBy?: string | null;
  collectedAt?: string | null;
}

export interface FeeStructure {
  id: number;
  courseCode: string;
  courseName: string;
  semester: number;
  feeType: string;
  amount: string;
  dueDate: string;
}

export interface FeePayment {
  id: number;
  feeRecordId: number;
  studentId: number;
  studentName: string;
  amount: string;
  paymentMethod: string;
  receiptNumber: string;
  paidAt: string;
  /** Who collected this payment (session actor admin, bursar or faculty). */
  collectedBy?: string | null;
  collectedById?: number | null;
}

/** Outstanding amount (total  paid so far), never negative. */
export function feeRemaining(f: Pick<FeeRecord, "amount" | "paidAmount">): number {
  return Math.max(0, Number(f.amount || 0) - Number(f.paidAmount || 0));
}

/**
 * Effective status honouring partial payments: fully covered → paid;
 * otherwise overdue once the due date has passed, else pending.
 */
export function feeEffectiveStatus(f: Pick<FeeRecord, "status" | "dueDate" | "amount" | "paidAmount">): "paid" | "pending" | "overdue" {
  if (feeRemaining(f) <= 0) return "paid";
  if (f.status === "overdue") return "overdue";
  const today = new Date().toISOString().split("T")[0];
  if (String(f.dueDate) < today) return "overdue";
  return "pending";
}

export interface Assignment {
  id: number;
  courseId: number;
  courseName: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  facultyName: string;
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  submissionText?: string | null;
  fileUrl?: string | null;
  status: "submitted" | "graded";
  marks?: string | null;
  feedback?: string | null;
  submittedAt?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  category: string;
  priority: "normal" | "urgent";
  authorName: string;
  publishedDate: string;
}

export interface TimetableSlot {
  id: number;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  facultyName: string;
}

export interface LeaveRequest {
  id: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  department: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  createdAt?: string;
}

export interface AdmissionInfo {
  id: number;
  studentId: number;
  admissionNumber: string;
  admissionDate: string;
  category: string;
  previousInstitution?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  guardianPhone?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  isHosteler: number;
}

export interface StudentDocument {
  id: number;
  studentId: number;
  studentName: string;
  title: string;
  category: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  data: string;
  status: string;
  uploadedAt?: string;
}

export interface Enrollment {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  semester: number;
  status: string;
}

export interface Section {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  room?: string | null;
}

export interface SemesterInfo {
  id: number;
  number: number;
  name: string;
  department: string;
  status: string;
  startsOn?: string | null;
  endsOn?: string | null;
}

export interface AcademicSession {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: number;
}

export interface ExamSchedule {
  id: number;
  examType: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
}

export interface ExamDefinition {
  id: number;
  name: string;
  examType: string;
  department: string;
  semester: number;
  session: string;
  startDate: string;
  endDate: string;
  status: string;
  passingPercent: number;
}

export interface InternalMark {
  id: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  examType: string;
  semester: number;
  theoryMarks: string;
  practicalMarks: string;
  maxTheory: string;
  maxPractical: string;
  totalMarks: string;
  maxTotal: string;
  passMarks: string;
  gradeLetter: string;
  result: string;
  status: string;
  remarks?: string | null;
}

export interface PermissionRow {
  id: number;
  role: string;
  module: string;
  canView: number;
  canCreate: number;
  canEdit: number;
  canDelete: number;
}

export interface FacultyAttendance {
  id: number;
  facultyId: number;
  facultyName: string;
  date: string;
  status: "present" | "absent" | "late";
  markedBy?: string | null;
  createdAt?: string;
}

export interface CourseMaterial {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  moduleName: string;
  title: string;
  description?: string | null;
  type: "PDF" | "PPT" | "Video" | "Notes";
  fileUrl: string;
  fileSize: string;
  facultyId?: number | null;
  facultyName: string;
  downloadCount: number;
  createdAt?: string;
}

export interface AuditLogRecord {
  id: number | string;
  user: string;
  userRole: "admin" | "faculty" | "student" | "system";
  action: string;
  module: string;
  record: string;
  timestamp: string;
  ipAddress: string;
  oldValue: string;
  newValue: string;
  severity?: "info" | "warning" | "critical";
}

export interface CampusEvent {
  id: number;
  title: string;
  code: string;
  date: string;
  time: string;
  venue: string;
  department: string;
  createdBy: string;
  coordinators: string[]; // array of student roll numbers or names
  description?: string;
}

export interface EventRegistration {
  id: number;
  eventId: number;
  studentId: number;
  studentName: string;
  rollNo: string;
  department: string;
  registeredAt: string;
  attendanceStatus: "unregistered" | "not_scanned" | "pending_verification" | "present" | "rejected";
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  qrRound?: string | null;
}

export interface EventQrWindow {
  id: string; // e.g. "QR-01"
  eventId: number;
  roundNumber: number;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string; // ISO string
  isActive: boolean;
  createdBy: string;
  payload: string;
}




export interface Competition {
  id: number;
  title: string;
  description: string;
  type: "Hackathon" | "Coding Contest" | "Quiz" | "Case Competition" | "Debate" | "Presentation" | "Business Plan" | "Technical Competition";
  regStart: string;
  regEnd: string;
  compDate: string;
  teamSizeMin: number;
  teamSizeMax: number;
  eligibilityDept: string;
  rules?: string;
  problemStatements?: string;
  submissionDeadline: string;
  evaluationCriteria?: string;
  prizes?: string;
  isLeaderboardPublished: number;
  status: "draft" | "open" | "ongoing" | "judging" | "completed";
  createdAt?: string;
}

export interface CompetitionTeamMember {
  id: number;
  teamId: number;
  userId: number;
  userName: string;
  email: string;
  roleInTeam: "captain" | "member";
  status: "invited" | "accepted" | "declined";
  joinedAt?: string;
}

export interface CompetitionTeam {
  id: number;
  competitionId: number;
  teamName: string;
  captainId: number;
  captainName: string;
  isLocked: number;
  createdAt?: string;
  members: CompetitionTeamMember[];
}

export interface CompetitionSubmission {
  id: number;
  competitionId: number;
  teamId: number;
  teamName: string;
  projectTitle: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  pptUrl?: string;
  screenshotsUrl?: string;
  videoUrl?: string;
  isLocked: number;
  submittedAt?: string;
}

export interface CompetitionEvaluation {
  id: number;
  competitionId: number;
  teamId: number;
  teamName?: string;
  judgeId: number;
  judgeName: string;
  scoreInnovation: number;
  scoreTech: number;
  scoreUiUx: number;
  scoreImpact: number;
  scorePresentation: number;
  totalScore: number;
  remarks?: string;
  evaluatedAt?: string;
}

export interface CompetitionCertificate {
  id: number;
  competitionId: number;
  competitionTitle: string;
  userId: number;
  userName: string;
  teamName?: string;
  certType: "winner_1st" | "winner_2nd" | "winner_3rd" | "finalist" | "participant";
  certCode: string;
  qrPayload: string;
  issuedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: number;
  teamName: string;
  projectTitle: string;
  score: number;
  judgeCount: number;
}
